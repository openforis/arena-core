import { User } from '../../auth'
import { Dictionary } from '../../common'
import { Labels } from '../../language'
import { Node, NodeKeys, Nodes, NodeValues } from '../../node'
import { NodeDef, NodeDefExpression, NodeDefProps, NodeDefs, NodeDefType } from '../../nodeDef'
import { CategoryItemProvider } from '../../nodeDefExpressionEvaluator/categoryItemProvider'
import { Survey, Surveys } from '../../survey'
import { SurveyDependencyType } from '../../survey/survey'
import { Objects, Promises } from '../../utils'
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

interface AttributeValidatorParamsCommon {
  user: User
  survey: Survey
  categoryItemProvider?: CategoryItemProvider
  record: Record
}

interface AttributeValidatorParams extends AttributeValidatorParamsCommon {
  attribute: Node
}

export interface AttributesValidatorParams extends AttributeValidatorParamsCommon {
  nodes: Dictionary<Node>
}

const _getSiblingNodeKeys = (params: AttributeValidatorParams): Node[] => {
  const { survey, record, attribute } = params

  const parentNode = Records.getParent(attribute)(record) || Records.getRoot(record)
  const siblingNodes = parentNode ? Records.getChildren(parentNode, attribute.nodeDefUuid)(record) : []

  const siblingKeyNodes = siblingNodes.reduce(
    (acc: Node[], sibling) => [...acc, ...Records.getEntityKeyNodes({ survey, record, entity: sibling })],
    []
  )

  return siblingKeyNodes
}

const _getValidationMessagesWithDefault = (params: {
  survey: Survey
  expression: NodeDefExpression
  defaultMessage?: string
}): Labels => {
  const { survey, expression, defaultMessage } = params
  const messages: Labels = expression.messages ?? {}

  const languages = survey.props.languages

  for (const lang of languages) {
    const customMessage = messages[lang]
    if (Objects.isEmpty(customMessage) && !Objects.isEmpty(defaultMessage)) {
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
  }
) => {
  const { survey, record, nodeDef, nodeParent, attribute } = params
  if (!NodeDefs.isKey(nodeDef) || !nodeParent || (NodeDefs.isAutoIncrementalKey(nodeDef) && attribute.created)) {
    // when a new node is created and the key is autoincremental, its value will be unique
    // and the validation of sibling key attributes is not necessary
    return []
  }
  // when a key attribute is updated, a sibling key attribute with the same value
  // or a sibling attribute with a validation error (duplicate key) should be re-validated
  const siblingNodeKeys = _getSiblingNodeKeys(params)
  const siblingNodeKeysWithSameValue: Node[] = []
  const siblingNodeKeysWithErrors: Node[] = []
  siblingNodeKeys.forEach((nodeKey) => {
    if (
      NodeValues.isValueEqual({
        survey,
        nodeDef,
        parentNode: nodeParent,
        value: nodeKey.value,
        valueSearch: attribute.value,
      })
    ) {
      siblingNodeKeysWithSameValue.push(nodeKey)
    }
    const nodeValidation =
      record.validation && RecordValidations.getValidationNode({ nodeUuid: nodeKey.uuid })(record.validation)
    if (nodeValidation && !nodeValidation.valid) {
      siblingNodeKeysWithErrors.push(nodeKey)
    }
  })
  return [...siblingNodeKeysWithSameValue, ...siblingNodeKeysWithErrors]
}

const findNodesToValidate = (params: AttributesValidatorParams): Node[] => {
  const { survey, record, nodes } = params

  return Object.values(nodes).reduce((acc: Node[], node) => {
    const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: node.nodeDefUuid })
    if (!NodeDefs.isAttribute(nodeDef)) {
      return acc
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

    acc.push(...NodePointers.getNodesFromNodePointers({ record, nodePointers: nodePointersAttributeAndDependents }))
    acc.push(...findSiblingKeyNodesToValidate({ ...params, nodeDef, nodeParent, attribute: node }))

    if (NodeDefs.getValidations(nodeDef)?.unique) {
      acc.push(...Records.getNodeSiblings({ record, node, nodeDef }))
    }
    return acc
  }, [])
}

const validateSelfAndDependentAttributes = async (params: AttributesValidatorParams): Promise<ValidationFields> => {
  const nodesToValidate: Node[] = findNodesToValidate(params)
  const validationsByNodeUuid: ValidationFields = {}

  await Promises.each(nodesToValidate, async (nodeToValidate) => {
    const nodeUuid = nodeToValidate.uuid
    // Validate only attributes not deleted and not validated already
    if (!nodeToValidate.deleted && !validationsByNodeUuid[nodeUuid]) {
      validationsByNodeUuid[nodeUuid] = await validateAttribute({ ...params, attribute: nodeToValidate })
    }
  })
  return validationsByNodeUuid
}

export const AttributeValidator = {
  validateSelfAndDependentAttributes,
}
