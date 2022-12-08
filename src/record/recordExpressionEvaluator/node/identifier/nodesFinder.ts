import { Node, Nodes } from '../../../../node'
import { NodeDef, NodeDefType } from '../../../../nodeDef'
import { Record } from '../../../record'
import { Records } from '../../../records'
import { Survey, Surveys } from '../../../../survey'
import { Arrays } from '../../../../utils'

const getCommonAncestor = (params: {
  record: Record
  nodeCtxHierarchy: string[]
  nodeDefCtx: NodeDef<any>
  nodeDefReferenced: NodeDef<any>
}): Node | undefined => {
  const { record, nodeCtxHierarchy, nodeDefCtx, nodeDefReferenced } = params
  if (!nodeDefCtx.parentUuid) {
    return Records.getRoot(record)
  }
  const nodeDefReferencedH = nodeDefReferenced.meta.h
  const nodeDefCtxH = nodeDefCtx.meta.h
  const nodeDefCommonH = Arrays.intersection(nodeDefReferencedH, nodeDefCtxH)
  if (nodeDefCommonH.length === 1) {
    return Records.getRoot(record)
  }
  if (nodeDefCommonH.length > 1) {
    const nodeCommonAncestorUuid = nodeCtxHierarchy[nodeDefCommonH.length - 1]
    return record.nodes?.[nodeCommonAncestorUuid]
  }
  return undefined
}

const getReferencedNodesParent = (params: {
  survey: Survey
  record: Record
  nodeContext: Node
  nodeDefReferenced: NodeDef<any>
}): Node | undefined => {
  const { survey, record, nodeContext, nodeDefReferenced } = params

  // Referenced node is a child of the context node
  if (nodeDefReferenced.parentUuid === nodeContext.nodeDefUuid) {
    return nodeContext
  }

  const nodeDefCtx = Surveys.getNodeDefByUuid({ survey, uuid: nodeContext.nodeDefUuid })

  const nodeCtxH = Nodes.getHierarchy(nodeContext)
  if (nodeDefCtx.type === NodeDefType.entity) {
    // When nodeDefCtx is entity, expression is type applicableIf (and context always starts from parent)
    nodeCtxH.push(nodeContext.uuid)
  }

  if (Surveys.isNodeDefAncestor({ nodeDefAncestor: nodeDefReferenced, nodeDefDescendant: nodeDefCtx })) {
    const nodeDefReferencedH = nodeDefReferenced.meta.h
    const nodeReferencedParentUuid = nodeCtxH[nodeDefReferencedH.length - 1]
    const nodeReferencedParent = record.nodes?.[nodeReferencedParentUuid]
    if (!nodeReferencedParent) {
      throw new Error(`Cannot find parent node of ${nodeDefReferenced.props.name} from ${nodeDefCtx.props.name}`)
    }
    return nodeReferencedParent
  }

  const nodeCommonAncestor = getCommonAncestor({
    record,
    nodeCtxHierarchy: nodeCtxH,
    nodeDefCtx,
    nodeDefReferenced,
  })
  if (!nodeCommonAncestor) return undefined

  const nodeDefReferencedParent = Surveys.getNodeDefParent({ survey, nodeDef: nodeDefReferenced })
  if (!nodeDefReferencedParent) return undefined

  return Records.getDescendant({ record, node: nodeCommonAncestor, nodeDefDescendant: nodeDefReferencedParent })
}

// Get reachable nodes, i.e. the children of the node's ancestors.
// NOTE: The root node is excluded, but it _should_ be an entity, so that is fine.
const findDescendants = (params: {
  survey: Survey
  record: Record
  nodeContext: Node
  nodeDefReferenced: NodeDef<any>
}): Node[] => {
  const { survey, record, nodeContext, nodeDefReferenced } = params
  const nodeReferencedParent = getReferencedNodesParent({ survey, record, nodeContext, nodeDefReferenced })

  if (nodeReferencedParent) {
    return Records.getChildren(nodeReferencedParent, nodeDefReferenced.uuid)(record)
  }
  return []
}

export const NodesFinder = {
  findDescendants,
}
