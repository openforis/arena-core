import { SystemError } from '../../error'
import { Node, NodePointer } from '../../node'
import { NodeDef, NodeDefExpression, NodeDefProps, NodeDefType, NodeDefs } from '../../nodeDef'
import { Survey, SurveyDependencyType, Surveys } from '../../survey'
import { Record } from '../record'
import { Records } from '../records'

export const throwError = (params: {
  error: any
  errorKey: string
  expressionType: SurveyDependencyType
  survey: Survey
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
  expressionsToEvaluate: NodeDefExpression[]
}) => {
  const { error, errorKey, expressionType, survey, nodeDef, expressionsToEvaluate } = params
  const nodeDefName = nodeDef.props.name
  const expressionsString = JSON.stringify(expressionsToEvaluate)

  throw new SystemError(errorKey, {
    surveyName: survey.props.name,
    nodeDefName,
    expressionType,
    expressionsString,
    error: error.toString(),
    errorJson: error instanceof SystemError ? error.toJSON() : null,
  })
}

const addPointerIfAccepted = (params: {
  nodePointers: NodePointer[]
  pointer: NodePointer
  filterFn?: (nodePointer: NodePointer) => boolean
}) => {
  const { nodePointers, pointer, filterFn } = params
  if (!filterFn || filterFn(pointer)) {
    nodePointers.push(pointer)
  }
}

const addNewEntitySelfPointer = (params: {
  nodePointers: NodePointer[]
  survey: Survey
  record: Record
  node: Node
  sourceNodeDef: NodeDef<NodeDefType, NodeDefProps>
  filterFn?: (nodePointer: NodePointer) => boolean
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
  nodePointers: NodePointer[]
  survey: Survey
  node: Node
  sourceNodeDef: NodeDef<NodeDefType, NodeDefProps>
  filterFn?: (nodePointer: NodePointer) => boolean
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

const addExistingEntityDependentSelfPointers = (params: {
  nodePointers: NodePointer[]
  record: Record
  filterFn?: (nodePointer: NodePointer) => boolean
}) => {
  const { nodePointers, record, filterFn } = params
  // For each entity node in the dependent list, add a self-pointer to reevaluate its own editable/visible status
  // This handles existing entities that come through onUpdate dependency paths
  for (const pointer of nodePointers) {
    const nodeDef = pointer.nodeDef
    const nodeCtx = pointer.nodeCtx
    if (NodeDefs.isEntity(nodeDef) && nodeCtx.parentUuid) {
      const parentNode = Records.getNodeByUuid(nodeCtx.parentUuid)(record)
      if (parentNode) {
        addPointerIfAccepted({
          nodePointers,
          pointer: { nodeCtx: parentNode, nodeDef },
          filterFn,
        })
      }
    }
  }
}

export const getDependentNodePointersByType = (params: {
  survey: Survey
  record: Record
  node: Node
  dependencyType: SurveyDependencyType
  includeSelfWhenSourceIsAttribute?: boolean
  includeNewEntitySelf?: boolean
  includeNewEntityChildPointers?: boolean
  filterFn?: (nodePointer: NodePointer) => boolean
}): NodePointer[] => {
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

  const nodePointers = Records.getDependentNodePointers({
    survey,
    record,
    node,
    dependencyType,
    includeSelf,
    filterFn,
  })

  // For any entity nodes in the dependent list (whether existing or new), add self-pointers
  // to reevaluate their own editable/visible/applicable expressions relative to their parent.
  if (includeNewEntitySelf) {
    addExistingEntityDependentSelfPointers({ nodePointers, record, filterFn })
  }

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
