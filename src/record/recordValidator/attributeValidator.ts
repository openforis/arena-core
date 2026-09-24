import { User } from '../../auth'
import { Dictionary } from '../../common'
import { Labels } from '../../language'
import { Node, NodeKeys, Nodes, NodeValues } from '../../node'
import { NodeDef, NodeDefExpression, NodeDefProps, NodeDefs, NodeDefType } from '../../nodeDef'
import { CategoryItemProvider } from '../../nodeDefExpressionEvaluator/categoryItemProvider'
import { TaxonProvider } from '../../nodeDefExpressionEvaluator/taxonProvider'
import { Survey, Surveys } from '../../survey'
import { SurveyDependencyType } from '../../survey/survey'
import { Objects } from '../../utils'
import {
  ValidationFactory,
  ValidationResult,
  ValidationResultFactory,
  ValidationSeverity,
  Validator,
} from '../../validation'
import { ValidationFields } from '../../validation/validation'
import { NodePointers } from '../nodePointers'
import { Record } from '../record'
import { RecordExpressionEvaluator } from '../recordExpressionEvaluator'
import { Records } from '../records'
import { RecordValidations } from '../recordValidations'
import { AttributeKeyValidator } from './attributeKeyValidator'
import { AttributeTypeValidator } from './attributeTypeValidator'
import { AttributeUniqueValidator } from './attributeUniqueValidator'

const expressionEvaluator = new RecordExpressionEvaluator()

export interface RecordValidatorParams {
  user: User
  survey: Survey
  categoryItemProvider?: CategoryItemProvider
  taxonProvider?: TaxonProvider
  record: Record
}

export interface AttributeValidatorParams extends RecordValidatorParams {
  attribute: Node
}

export interface AttributesValidatorParams extends RecordValidatorParams {
  nodes: Dictionary<Node>
}

export interface SortedAttributesValidatorParams extends RecordValidatorParams {
  nodesArray: Node[]
}

type SiblingKeyNodeItem = { entityUuid: string; keyNode: Node; hasErrors: boolean }

// sibling key nodes are cached by ancestor multiple entity parent and def uuid during the same validation call:
// when many entities are added to the same parent entity (e.g. data import), computing them for every updated
// key attribute would take a time that grows quadratically with the number of entities
type SiblingKeyNodesCache = Map<string, SiblingKeyNodeItem[]>

const _getSiblingNodeKeys = (
  params: AttributeValidatorParams & { siblingKeyNodesCache?: SiblingKeyNodesCache }
): SiblingKeyNodeItem[] => {
  const { survey, record, attribute, siblingKeyNodesCache } = params

  const attributeDef = Surveys.getNodeDefByUuid({ survey, uuid: attribute.nodeDefUuid })
  const ancestorMultipleEntityDef = Surveys.getNodeDefAncestorMultipleEntity({ survey, nodeDef: attributeDef })
  if (!ancestorMultipleEntityDef) {
    return []
  }
  const ancestorMultipleEntity = Records.getAncestor({
    record,
    node: attribute,
    ancestorDefUuid: ancestorMultipleEntityDef.uuid,
  })
  if (!ancestorMultipleEntity) return []

  const ancestorMultipleEntityParent = Records.getParent(ancestorMultipleEntity)(record)
  if (!ancestorMultipleEntityParent) return []

  const cacheKey = `${ancestorMultipleEntityParent.uuid}_${ancestorMultipleEntityDef.uuid}`
  let items = siblingKeyNodesCache?.get(cacheKey)
  if (!items) {
    const keyDefs = Surveys.getNodeDefKeys({ survey, nodeDef: ancestorMultipleEntityDef })
    const entities = Records.getEntitySiblings({ record, entity: ancestorMultipleEntity, includeSelf: true })
    items = []
    for (const entity of entities) {
      const keyNodes = Records.getEntityKeyNodes({ survey, record, entity, keyDefs })
      for (const keyNode of keyNodes) {
        if (!keyNode) continue
        const nodeValidation =
          record.validation && RecordValidations.getValidationNode({ nodeUuid: keyNode.uuid })(record.validation)
        items.push({ entityUuid: entity.uuid, keyNode, hasErrors: !!nodeValidation && !nodeValidation.valid })
      }
    }
    siblingKeyNodesCache?.set(cacheKey, items)
  }
  return items.filter((item) => item.entityUuid !== ancestorMultipleEntity.uuid)
}

const _getValidationMessagesWithDefault = (params: {
  survey: Survey
  expression: NodeDefExpression
  defaultMessage?: string
}): Labels => {
  const { survey, expression, defaultMessage } = params
  const messages: Labels = { ...(expression.messages ?? {}) }

  const languages = Surveys.getLanguages(survey)
  const defaultMessageDefined = Objects.isNotEmpty(defaultMessage)

  for (const lang of languages) {
    const customMessage = messages[lang]
    if (Objects.isEmpty(customMessage) && defaultMessageDefined) {
      messages[lang] = defaultMessage
    }
  }

  return messages
}

const _validateRequired =
  (params: { nodeDef: NodeDef<NodeDefType, NodeDefProps> }) =>
  async (_field: string, node: any): Promise<ValidationResult> => {
    const { nodeDef } = params
    const valid = (!NodeDefs.isKey(nodeDef) && !NodeDefs.isRequired(nodeDef)) || !Nodes.isValueBlank(node)
    return valid
      ? ValidationResultFactory.createInstance()
      : ValidationResultFactory.createInstance({
          key: 'record.attribute.valueRequired',
          severity: ValidationSeverity.error,
          valid,
        })
  }

/**
 * Evaluates the validation expressions.
 */
const _validateNodeValidations =
  (params: { user: User; survey: Survey; record: Record; nodeDef: NodeDef<NodeDefType, NodeDefProps> }) =>
  async (_propName: string, node: Node): Promise<ValidationResult> => {
    const { user, survey, record, nodeDef } = params
    if (Nodes.isValueBlank(node)) return ValidationResultFactory.createInstance()

    const validations = NodeDefs.getValidations(nodeDef)
    if (!validations?.expressions?.length) return ValidationResultFactory.createInstance()

    const applicableExpressionsEval = await expressionEvaluator.evalApplicableExpressions({
      user,
      survey,
      record,
      nodeCtx: node,
      expressions: validations.expressions,
      stopAtFirstFound: false,
    })

    let validationResult = ValidationResultFactory.createInstance()

    for (const { expression, value: valid } of applicableExpressionsEval) {
      if (!valid) {
        const messages = _getValidationMessagesWithDefault({
          survey,
          expression,
          defaultMessage: expression.expression,
        })

        validationResult = ValidationResultFactory.createInstance({
          valid: false,
          key: 'record.attribute.customValidation',
          severity: expression.severity,
          messages,
        })
        break
      }
    }

    return validationResult
  }

const validateAttribute = async (params: AttributeValidatorParams) => {
  const { survey, record, attribute } = params
  if (Records.isNodeApplicable({ record, node: attribute })) {
    const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: attribute.nodeDefUuid })
    const validatorParams = { ...params, nodeDef }
    return new Validator().validate(attribute, {
      [NodeKeys.value]: [
        _validateRequired({ nodeDef }),
        AttributeTypeValidator.validateValueType(validatorParams),
        _validateNodeValidations(validatorParams),
        AttributeKeyValidator.validateAttributeKey(validatorParams),
        AttributeUniqueValidator.validateAttributeUnique(validatorParams),
      ],
    })
  }
  return ValidationFactory.createInstance()
}

const findSiblingKeyNodesToValidate = (
  params: AttributeValidatorParams & {
    nodeDef: NodeDef<NodeDefType, NodeDefProps>
    nodeParent?: Node
    siblingKeyNodesCache?: SiblingKeyNodesCache
  }
) => {
  const { survey, nodeDef, nodeParent: parentNode, attribute } = params
  if (
    !NodeDefs.isKey(nodeDef) ||
    !parentNode ||
    (NodeDefs.isAutoIncrementalKey(nodeDef) && attribute.created && Nodes.isDefaultValueApplied(attribute))
  ) {
    // when a new node is created and the key is autoincremental, its value will be unique
    // and the validation of sibling key attributes is not necessary
    return []
  }
  // when a key attribute is updated, a sibling key attribute with the same value
  // or a sibling attribute with a validation error (duplicate key) should be re-validated
  const siblingNodeKeys = _getSiblingNodeKeys(params)
  const siblingNodeKeysWithSameValue: Node[] = []
  const siblingNodeKeysWithErrors: Node[] = []
  siblingNodeKeys.forEach(({ keyNode, hasErrors }) => {
    if (NodeValues.isValueEqual({ survey, nodeDef, parentNode, value: keyNode.value, valueSearch: attribute.value })) {
      siblingNodeKeysWithSameValue.push(keyNode)
    }
    if (hasErrors) {
      siblingNodeKeysWithErrors.push(keyNode)
    }
  })
  return [...siblingNodeKeysWithSameValue, ...siblingNodeKeysWithErrors]
}

const findSortedNodesToValidate = (params: SortedAttributesValidatorParams): Node[] => {
  const { survey, record, nodesArray } = params

  const result = []
  const siblingKeyNodesCache: SiblingKeyNodesCache = new Map()
  for (const node of nodesArray) {
    const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: node.nodeDefUuid })
    if (!NodeDefs.isAttribute(nodeDef)) {
      continue
    }
    // Get dependents and attribute itself
    const nodePointersAttributeAndDependents = Records.getDependentNodePointers({
      survey,
      record,
      node,
      dependencyType: SurveyDependencyType.validations,
      includeSelf: true,
    })

    const nodeParent = Records.getParent(node)(record)

    result.push(
      ...NodePointers.getNodesFromNodePointers({ record, nodePointers: nodePointersAttributeAndDependents }),
      ...findSiblingKeyNodesToValidate({ ...params, nodeDef, nodeParent, attribute: node, siblingKeyNodesCache })
    )

    if (NodeDefs.getValidations(nodeDef)?.unique) {
      result.push(...Records.getAttributeSiblings({ record, node, nodeDef }))
    }
  }

  return result
}

const validateSelfAndDependentSortedAttributes = async (
  params: SortedAttributesValidatorParams
): Promise<ValidationFields> => {
  const nodesToValidate: Node[] = findSortedNodesToValidate(params)
  const validationsByNodeUuid: ValidationFields = {}

  for (const nodeToValidate of nodesToValidate) {
    const nodeUuid = nodeToValidate.uuid
    // Validate only attributes not deleted and not validated already
    if (!nodeToValidate.deleted && !validationsByNodeUuid[nodeUuid]) {
      validationsByNodeUuid[nodeUuid] = await validateAttribute({ ...params, attribute: nodeToValidate })
    }
  }
  return validationsByNodeUuid
}

export const AttributeValidator = {
  validateSelfAndDependentSortedAttributes,
}
