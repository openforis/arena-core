import { Node, Nodes } from '../../node'
import { Objects } from '../../utils'
import { Record, RecordNodesIndex } from '../record'

export const getNodeRootUuid = (record: Record): string | undefined => record._nodesIndex?.nodeRootUuid

export const getNodeUuidsByDef =
  (nodeDefUuid: string) =>
  (record: Record): string[] =>
    Object.keys(record._nodesIndex?.nodesByDef[nodeDefUuid] || {})

export const getNodeUuidsByParentAndChildDef =
  (params: { parentNodeUuid: string; childDefUuid: string }) =>
  (record: Record): string[] => {
    const { parentNodeUuid, childDefUuid } = params
    return Object.keys(record._nodesIndex?.nodesByParentAndChildDef[parentNodeUuid]?.[childDefUuid] || {})
  }

export const getNodeUuidsByParent =
  (parentNodeUuid: string) =>
  (record: Record): string[] => {
    const nodesPresenceByChildDefUuid = record._nodesIndex?.nodesByParentAndChildDef[parentNodeUuid] || {}
    return Object.values(nodesPresenceByChildDefUuid).flatMap((nodesPresence) => Object.keys(nodesPresence))
  }


  const _addNode =
    (node: Node) => (index: RecordNodesIndex):RecordNodesIndex =>  {
    
    const nodeUuid = node.uuid
    const nodeDefUuid = node.nodeDefUuid

    if (Nodes.isRoot(node)) {
        return {...index, nodeRootUuid: nodeUuid}
    }
    const nodesPresenceByChildDefUuid = index.nodesByParentAndChildDef[nodeUuid] || {}
    const nodesPresence = nodesPresenceByChildDefUuid [nodeDefUuid] || {}
    const nodesPresenceUpdated ={...nodesPresence, [nodeUuid]: true}
    const nodesPresenceByChildDefUuidUpdated = {...nodesPresenceByChildDefUuid, [nodeDefUuid]: nodesPresenceUpdated}
    return {...index, [nodeUuid]: nodesPresenceByChildDefUuidUpdated}


    return R.pipe(
      // RootUuid
      R.when(R.always(Node.isRoot(node)), R.assoc(keys.nodeRootUuid, nodeUuid)),
      // Parent index
      _assocToIndexPath({
        path: [keys.nodesByParentAndDef, Node.getParentUuid(node), nodeDefUuid],
        value: nodeUuid,
        avoidDuplicates,
      }),
      // Node def index
      _assocToIndexPath({ path: [keys.nodesByDef, nodeDefUuid], value: nodeUuid, avoidDuplicates }),
      // Code dependent index
      _addNodeToCodeDependentsIndex({ node, avoidDuplicates })
    )(record)
  }

/**