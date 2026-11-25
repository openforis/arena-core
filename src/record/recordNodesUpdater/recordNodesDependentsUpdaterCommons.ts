import { SystemError } from '../../error'
import { ArenaRecordNode, ArenaRecordNodePointer } from '../../node'
import { ArenaAnyNodeDef, ArenaNodeDefExpression, NodeDefs } from '../../nodeDef'
import { ArenaSurvey, SurveyDependencyType, Surveys } from '../../survey'
import { ArenaRecord } from '../record'
import { Records } from '../records'

/**
 * Returns the node referenced by "this" when evaluating the expressions of a node def in the context of its parent entity:
 * the node of the node def, if single; null if the node def is multiple (the node is not determined) or the node doesn't exist.
 */
export const getNodeCurrent = (params: {
  record: ArenaRecord
  nodeCtx: ArenaRecordNode
  nodeDef: ArenaAnyNodeDef
}): ArenaRecordNode | null => {
  const { record, nodeCtx, nodeDef } = params
  if (NodeDefs.isMultiple(nodeDef)) return null
  return Records.getChildren(nodeCtx, nodeDef.uuid)(record)[0] ?? null
}

export const throwError = (params: {
  error: any
  errorKey: string
  expressionType: SurveyDependencyType
  survey: ArenaSurvey
  nodeDef: ArenaAnyNodeDef
  expressionsToEvaluate: ArenaNodeDefExpression[]
}) => {
  const { error, errorKey, expressionType, survey, nodeDef, expressionsToEvaluate } = params
  const nodeDefName = nodeDef.props.name
  const expressionsString = JSON.stringify(expressionsToEvaluate)

  throw new SystemError(
    errorKey,
    {
      surveyName: survey.props.name,
      nodeDefName,
      expressionType,
      expressionsString,
      error: error.toString(),
      errorJson: error instanceof SystemError ? error.toJSON() : null,
    },
    { cause: error }
  )
}

const addPointerIfAccepted = (params: {
  nodePointers: ArenaRecordNodePointer[]
  pointer: ArenaRecordNodePointer
  filterFn?: (nodePointer: ArenaRecordNodePointer) => boolean
}) => {
  const { nodePointers, pointer, filterFn } = params
  if (!filterFn || filterFn(pointer)) {
    nodePointers.push(pointer)
  }
}

const addNewEntitySelfPointer = (params: {
  nodePointers: ArenaRecordNodePointer[]
  survey: ArenaSurvey
  record: ArenaRecord
  node: ArenaRecordNode
  sourceNodeDef: ArenaAnyNodeDef
  filterFn?: (nodePointer: ArenaRecordNodePointer) => boolean
}) => {
  const { nodePointers, record, node, sourceNodeDef, filterFn } = params
  if (!node.parentUuid) {
    return
  }
  const parentNode = Records.getNodeByUuid(node.parentUuid)(record)
  if (!parentNode) {
    return
  }
  addPointerIfAccepted({
    nodePointers,
    pointer: { nodeCtx: parentNode, nodeDef: sourceNodeDef },
    filterFn,
  })
}

const addNewEntityChildMultiplePointers = (params: {
  nodePointers: ArenaRecordNodePointer[]
  survey: ArenaSurvey
  node: ArenaRecordNode
  sourceNodeDef: ArenaAnyNodeDef
  filterFn?: (nodePointer: ArenaRecordNodePointer) => boolean
}) => {
  const { nodePointers, survey, node, sourceNodeDef, filterFn } = params
  const multipleNodeDefs = Surveys.getNodeDefChildren({ survey, nodeDef: sourceNodeDef }).filter(NodeDefs.isMultiple)

  for (const childDef of multipleNodeDefs) {
    addPointerIfAccepted({
      nodePointers,
      pointer: { nodeCtx: node, nodeDef: childDef },
      filterFn,
    })
  }
}

export const getDependentNodePointersByType = (params: {
  survey: ArenaSurvey
  record: ArenaRecord
  node: ArenaRecordNode
  dependencyType: SurveyDependencyType
  includeSelfWhenSourceIsAttribute?: boolean
  includeNewEntitySelf?: boolean
  includeNewEntityChildPointers?: boolean
  filterFn?: (nodePointer: ArenaRecordNodePointer) => boolean
}): ArenaRecordNodePointer[] => {
  const {
    survey,
    record,
    node,
    dependencyType,
    includeSelfWhenSourceIsAttribute = false,
    includeNewEntitySelf = false,
    includeNewEntityChildPointers = false,
    filterFn,
  } = params

  const sourceNodeDef = Surveys.getNodeDefByUuid({ survey, uuid: node.nodeDefUuid })
  const includeSelf = includeSelfWhenSourceIsAttribute && !NodeDefs.isEntity(sourceNodeDef)

  const nodePointers = Records.getDependentNodePointers(survey, node, dependencyType, includeSelf, filterFn)(record)

  if (!NodeDefs.isEntity(sourceNodeDef) || !node.created) {
    return nodePointers
  }

  // For newly created entities, include a self-pointer for the source node.
  if (includeNewEntitySelf) {
    addNewEntitySelfPointer({ nodePointers, survey, record, node, sourceNodeDef, filterFn })
  }

  // For new entities, include child multiple nodes so their dependency metadata/status gets updated too.
  if (includeNewEntityChildPointers) {
    addNewEntityChildMultiplePointers({ nodePointers, survey, node, sourceNodeDef, filterFn })
  }

  return nodePointers
}
