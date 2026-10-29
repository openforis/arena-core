import { User } from '../../auth'
import { Dictionary } from '../../common'
import { Labels } from '../../language'
import { ArenaRecordNode, NodeKeys, Nodes, NodeValues } from '../../node'
import { NodeDef, NodeDefExpression, NodeDefProps, NodeDefs, NodeDefType } from '../../nodeDef'
import { AreaOfInterestProvider } from '../../nodeDefExpressionEvaluator/areaOfInterestProvider'
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
import { ArenaRecord } from '../record'
import { RecordExpressionEvaluator } from '../recordExpressionEvaluator'
import { evaluateRequiredIf } from '../recordNodesUpdater/recordNodeDependentsRequiredUpdater'
import { Records } from '../records'
import { RecordValidations } from '../recordValidations'
import { AttributeKeyValidator, createEntityKeysCache, EntityKeysCache } from './attributeKeyValidator'
import { AttributeTypeValidator } from './attributeTypeValidator'
import { AttributeUniqueValidator } from './attributeUniqueValidator'

const expressionEvaluator = new RecordExpressionEvaluator()

export interface RecordValidatorParams {
  user: User
  survey: Survey
  categoryItemProvider?: CategoryItemProvider
  taxonProvider?: TaxonProvider
  areaOfInterestProvider?: AreaOfInterestProvider
  record: ArenaRecord
}

export interface AttributeValidatorParams extends RecordValidatorParams {
  attribute: ArenaRecordNode
}

export interface AttributesValidatorParams extends RecordValidatorParams {
  nodes: Dictionary<ArenaRecordNode>
}

export interface SortedAttributesValidatorParams extends RecordValidatorParams {
  nodesArray: ArenaRecordNode[]
}

type SiblingKeyNodeItem = { entityUuid: string; keyNode: ArenaRecordNode; hasErrors: boolean }

type SiblingKeyNodesGroup = {
  items: SiblingKeyNodeItem[]
  // items whose key node is not validated anyway (not in the nodes to validate): only these are compared by value
  itemsToCompare?: SiblingKeyNodeItem[]
  // entity of the first key attribute validated in this group: its key nodes with errors are not added
  // until a key attribute of another entity is validated
  firstEntityUuid?: string
  allItemsWithErrorsAdded?: boolean
}

// sibling key nodes are cached by ancestor multiple entity parent and def uuid during the same validation call:
// when many entities are added to the same parent entity (e.g. data import), computing them for every updated
// key attribute would take a time that grows quadratically with the number of entities
type SiblingKeyNodesCache = Map<string, SiblingKeyNodesGroup>

const _getSiblingNodeKeysGroup = (
  params: AttributeValidatorParams & { siblingKeyNodesCache: SiblingKeyNodesCache }
): { entityUuid: string; group: SiblingKeyNodesGroup } | undefined => {
  const { survey, record, attribute, siblingKeyNodesCache } = params

  const attributeDef = Surveys.getNodeDefByUuid({ survey, uuid: attribute.nodeDefUuid })
  const ancestorMultipleEntityDef = Surveys.getNodeDefAncestorMultipleEntity({ survey, nodeDef: attributeDef })
  if (!ancestorMultipleEntityDef) return undefined

  const ancestorMultipleEntity = Records.getAncestor(attribute, ancestorMultipleEntityDef.uuid)(record)
  if (!ancestorMultipleEntity) return undefined

  const ancestorMultipleEntityParent = Records.getParent(ancestorMultipleEntity)(record)
  if (!ancestorMultipleEntityParent) return undefined

  const cacheKey = `${ancestorMultipleEntityParent.uuid}_${ancestorMultipleEntityDef.uuid}`
  let group = siblingKeyNodesCache.get(cacheKey)
  if (!group) {
    const keyDefs = Surveys.getNodeDefKeys({ survey, nodeDef: ancestorMultipleEntityDef })
    const entities = Records.getEntitySiblings(ancestorMultipleEntity, true)(record)
    const items: SiblingKeyNodeItem[] = []
    for (const entity of entities) {
      const keyNodes = Records.getEntityKeyNodes(survey, entity, undefined, keyDefs)(record)
      for (const keyNode of keyNodes) {
        if (!keyNode) continue
        const nodeValidation =
          record.validation && RecordValidations.getValidationNode({ nodeUuid: keyNode.uuid })(record.validation)
        items.push({ entityUuid: entity.uuid, keyNode, hasErrors: !!nodeValidation && !nodeValidation.valid })
      }
    }
    group = { items }
    siblingKeyNodesCache.set(cacheKey, group)
  }
  return { entityUuid: ancestorMultipleEntity.uuid, group }
}

const _getValidationMessagesWithDefault = (params: {
  survey: Survey
  expression: NodeDefExpression
  defaultMessage?: string
}): Labels => {
  const { survey, expression, defaultMessage } = params
  const messages: Labels = { ...expression.messages }

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

const _isValueRequired = async (
  params: AttributeValidatorParams & { nodeDef: NodeDef<NodeDefType, NodeDefProps> }
): Promise<boolean> => {
  const { record, attribute, nodeDef } = params
  if (NodeDefs.isKey(nodeDef) || NodeDefs.isRequired(nodeDef)) return true
  if (!NodeDefs.isRequiredIfDefined(nodeDef)) return false
  const parentNode = Records.getParent(attribute)(record)
  if (!parentNode) return false
  // evaluated here (not read from the parent node meta flag) so validation doesn't depend on up to date node meta
  // (e.g. records created before the "required if" condition was defined)
  return evaluateRequiredIf({ ...params, nodeCtx: parentNode, nodeDef })
}

const _validateRequired =
  (params: AttributeValidatorParams & { nodeDef: NodeDef<NodeDefType, NodeDefProps> }) =>
  async (_field: string, node: any): Promise<ValidationResult> => {
    const valid = !Nodes.isValueBlank(node) || !(await _isValueRequired(params))
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
  (params: {
    user: User
    survey: Survey
    record: ArenaRecord
    nodeDef: NodeDef<NodeDefType, NodeDefProps>
    areaOfInterestProvider?: AreaOfInterestProvider
  }) =>
  async (_propName: string, node: ArenaRecordNode): Promise<ValidationResult> => {
    const { user, survey, record, nodeDef, areaOfInterestProvider } = params
    if (Nodes.isValueBlank(node)) return ValidationResultFactory.createInstance()

    const validations = NodeDefs.getValidations(nodeDef)
    if (!validations?.expressions?.length) return ValidationResultFactory.createInstance()

    const applicableExpressionsEval = await expressionEvaluator.evalApplicableExpressions({
      user,
      survey,
      record,
      areaOfInterestProvider,
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

const validateAttribute = async (params: AttributeValidatorParams & { entityKeysCache?: EntityKeysCache }) => {
  const { survey, record, attribute } = params
  if (Records.isNodeApplicable(attribute)(record)) {
    const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: attribute.nodeDefUuid })
    const validatorParams = { ...params, nodeDef }
    return new Validator().validate(attribute, {
      [NodeKeys.value]: [
        _validateRequired(validatorParams),
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
    nodeParent?: ArenaRecordNode
    siblingKeyNodesCache: SiblingKeyNodesCache
    nodeUuidsToValidate: Set<string>
  }
): ArenaRecordNode[] => {
  const { survey, nodeDef, nodeParent: parentNode, attribute, nodeUuidsToValidate } = params
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
  const siblingNodeKeysGroup = _getSiblingNodeKeysGroup(params)
  if (!siblingNodeKeysGroup) return []

  const { entityUuid, group } = siblingNodeKeysGroup
  // key nodes in the nodes to validate are validated anyway: no need to compare their value
  group.itemsToCompare ??= group.items.filter((item) => !nodeUuidsToValidate.has(item.keyNode.uuid))

  const result: ArenaRecordNode[] = []
  for (const { entityUuid: itemEntityUuid, keyNode } of group.itemsToCompare) {
    if (
      itemEntityUuid !== entityUuid &&
      NodeValues.isValueEqual({ survey, nodeDef, parentNode, value: keyNode.value, valueSearch: attribute.value })
    ) {
      result.push(keyNode)
    }
  }
  // key nodes with errors (in entities other than the attribute's one) are added only once per group
  if (group.firstEntityUuid === undefined) {
    group.firstEntityUuid = entityUuid
    for (const item of group.items) {
      if (item.hasErrors && item.entityUuid !== entityUuid) result.push(item.keyNode)
    }
  } else if (!group.allItemsWithErrorsAdded && group.firstEntityUuid !== entityUuid) {
    group.allItemsWithErrorsAdded = true
    for (const item of group.items) {
      if (item.hasErrors && item.entityUuid === group.firstEntityUuid) result.push(item.keyNode)
    }
  }
  return result
}

// attribute siblings (same attribute def in the sibling entities) added to the nodes to validate,
// by parent entity def and parent of the parent entity
type AttributeSiblingsAddedCache = Map<string, { firstParentEntity: ArenaRecordNode; allSiblingsAdded?: boolean }>

const findUniqueAttributeSiblingsToValidate = (params: {
  record: ArenaRecord
  node: ArenaRecordNode
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
  nodeParent?: ArenaRecordNode
  attributeSiblingsAddedCache: AttributeSiblingsAddedCache
}): ArenaRecordNode[] => {
  const { record, node, nodeDef, nodeParent, attributeSiblingsAddedCache } = params
  if (!nodeParent) return []
  const nodeParentParent = Records.getParent(nodeParent)(record)
  if (!nodeParentParent) return []
  // the siblings of the attribute are the attributes in the other parent entities:
  // after visiting attributes in 2 different parent entities, all the attributes of the group have been added
  const cacheKey = `${nodeParentParent.uuid}_${nodeParent.nodeDefUuid}_${nodeDef.uuid}`
  const cached = attributeSiblingsAddedCache.get(cacheKey)
  if (!cached) {
    attributeSiblingsAddedCache.set(cacheKey, { firstParentEntity: nodeParent })
    return Records.getAttributeSiblings(node, nodeDef)(record)
  }
  if (cached.allSiblingsAdded || cached.firstParentEntity.uuid === nodeParent.uuid) return []
  cached.allSiblingsAdded = true
  return Records.getChildren(cached.firstParentEntity, nodeDef.uuid)(record)
}

const findSortedNodesToValidate = (params: SortedAttributesValidatorParams): ArenaRecordNode[] => {
  const { survey, record, nodesArray } = params

  const result: ArenaRecordNode[] = []
  const resultUuids = new Set<string>()
  const addToResult = (nodes: ArenaRecordNode[]) => {
    for (const node of nodes) {
      if (!resultUuids.has(node.uuid)) {
        resultUuids.add(node.uuid)
        result.push(node)
      }
    }
  }
  // every attribute in nodesArray is validated (it's included in its own dependents)
  const nodeUuidsToValidate = new Set(nodesArray.map((node) => node.uuid))
  const siblingKeyNodesCache: SiblingKeyNodesCache = new Map()
  const attributeSiblingsAddedCache: AttributeSiblingsAddedCache = new Map()
  for (const node of nodesArray) {
    const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: node.nodeDefUuid })
    if (!NodeDefs.isAttribute(nodeDef)) {
      continue
    }
    // Get dependents and attribute itself
    const nodePointersAttributeAndDependents = [
      ...Records.getDependentNodePointers(survey, node, SurveyDependencyType.validations, true)(record),
      ...Records.getDependentNodePointers(survey, node, SurveyDependencyType.required)(record),
    ]

    const nodeParent = Records.getParent(node)(record)

    addToResult(NodePointers.getNodesFromNodePointers({ record, nodePointers: nodePointersAttributeAndDependents }))
    addToResult(
      findSiblingKeyNodesToValidate({
        ...params,
        nodeDef,
        nodeParent,
        attribute: node,
        siblingKeyNodesCache,
        nodeUuidsToValidate,
      })
    )

    if (NodeDefs.getValidations(nodeDef)?.unique) {
      addToResult(
        findUniqueAttributeSiblingsToValidate({ record, node, nodeDef, nodeParent, attributeSiblingsAddedCache })
      )
    }
  }

  return result
}

const validateSelfAndDependentSortedAttributes = async (
  params: SortedAttributesValidatorParams
): Promise<ValidationFields> => {
  const nodesToValidate: ArenaRecordNode[] = findSortedNodesToValidate(params)
  const validationsByNodeUuid: ValidationFields = {}
  // the record doesn't change during the validation: entity keys can be cached
  const entityKeysCache = createEntityKeysCache()

  for (const nodeToValidate of nodesToValidate) {
    const nodeUuid = nodeToValidate.uuid
    // Validate only attributes not deleted and not validated already
    if (!nodeToValidate.deleted && !validationsByNodeUuid[nodeUuid]) {
      // sequential: avoid concurrent item/taxon lookups on large node sets
      const attributeValidatorParams = { ...params, attribute: nodeToValidate, entityKeysCache }
      validationsByNodeUuid[nodeUuid] = await validateAttribute(attributeValidatorParams) // NOSONAR
    }
  }
  return validationsByNodeUuid
}

export const AttributeValidator = {
  validateSelfAndDependentSortedAttributes,
}
