import { NodeDef, NodeDefCode, NodeDefCodeProps, NodeDefProps, NodeDefType } from '../../nodeDef'
import { Node, NodePointer, Nodes } from '../../node'
import { Record } from '../record'
import { Surveys } from '../../survey'
import { Arrays, Queue } from '../../utils'
import { Survey, SurveyDependencyType } from '../../survey/survey'
import { SystemError } from '../../error'
import { NodeValues } from '../../node/nodeValues'
import { RecordNodesIndexReader } from './recordNodesIndexReader'

export const getNodes = (record: Record): { [key: string]: Node } => record.nodes || {}

export const getNodesArray = (record: Record): Node[] => Object.values(getNodes(record))

export const getNodeByUuid =
  (uuid: string) =>
  (record: Record): Node | undefined =>
    record.nodes?.[uuid]

export const getNodesByUuids =
  (uuids: string[]) =>
  (record: Record): Node[] =>
    uuids.map((uuid: string) => getNodeByUuid(uuid)(record)) as Node[]

export const getRoot = (record: Record): Node | undefined => {
  const rootUuid = record._nodesIndex ? RecordNodesIndexReader.getNodeRootUuid(record._nodesIndex) : null
  if (rootUuid) {
    return getNodeByUuid(rootUuid)(record)
  }
  return getNodesArray(record).find((node) => !node.parentUuid)
}

export const getChildren =
  (parentNode: Node, childDefUuid?: string) =>
  (record: Record): Node[] => {
    if (record._nodesIndex) {
      const childrenUuids = childDefUuid
        ? RecordNodesIndexReader.getNodeUuidsByParentAndChildDef({
            parentNodeUuid: parentNode.uuid,
            childDefUuid,
          })(record._nodesIndex)
        : RecordNodesIndexReader.getNodeUuidsByParent(parentNode.uuid)(record._nodesIndex)
      return getNodesByUuids(childrenUuids)(record)
    }
    return getNodesArray(record).filter(
      (node) => node.parentUuid === parentNode.uuid && (!childDefUuid || node.nodeDefUuid == childDefUuid)
    )
  }

export const getChild =
  (parentNode: Node, childDefUuid: string) =>
  (record: Record): Node => {
    const children = getChildren(parentNode, childDefUuid)(record)
    if (children.length > 1) throw new SystemError('systemError.record.multipleNodesFound')
    if (children.length === 0) throw new SystemError('systemError.record.childNotFound')
    return children[0]
  }

export const getParent =
  (node: Node) =>
  (record: Record): Node | undefined =>
    node.parentUuid ? getNodeByUuid(node.parentUuid)(record) : undefined

export const getNodesByDefUuid =
  (nodeDefUuid: string) =>
  (record: Record): Node[] => {
    if (record._nodesIndex) {
      const nodeUuids = RecordNodesIndexReader.getNodeUuidsByDef(nodeDefUuid)(record._nodesIndex)
      return getNodesByUuids(nodeUuids)(record)
    }
    return getNodesArray(record).filter((node) => node.nodeDefUuid === nodeDefUuid)
  }

export const isNodeApplicable = (params: { record: Record; node: Node }): boolean => {
  const { record, node } = params
  const nodeParent = getParent(node)(record)
  if (!nodeParent) return true

  if (isNodeApplicable({ record, node: nodeParent })) {
    return Nodes.isChildApplicable(nodeParent, node.nodeDefUuid)
  }
  return false
}

export const getDependentCodeAttributes =
  (node: Node) =>
  (record: Record): Node[] => {
    if (record._nodesIndex) {
      const nodeUuids = RecordNodesIndexReader.getNodeCodeDependentUuids(node.uuid)(record._nodesIndex)
      return getNodesByUuids(nodeUuids)(record)
    }
    throw new SystemError('record.nodesIndexNotInitialized')
  }

export const getParentCodeAttribute =
  (params: { parentNode: Node; nodeDef: NodeDefCode }) =>
  (record: Record): Node | undefined => {
    const { parentNode, nodeDef } = params

    const parentCodeDefUuid = nodeDef.props.parentCodeDefUuid
    if (!parentCodeDefUuid) return undefined

    const ancestors = getAncestorsAndSelf({ record, node: parentNode })
    for (const ancestor of ancestors) {
      const children = getChildren(ancestor, parentCodeDefUuid)(record)
      if (children.length === 1) {
        return children[0]
      }
    }
    return undefined
  }

// ancestors
export const visitAncestorsAndSelf =
  (node: Node, visitor: (node: Node) => void) =>
  (record: Record): void => {
    let currentNode: Node | undefined = node
    while (currentNode) {
      visitor(currentNode)
      currentNode = getParent(currentNode)(record)
    }
  }

export const getAncestor = (params: { record: Record; node: Node; ancestorDefUuid: string }): Node => {
  const { record, node, ancestorDefUuid } = params
  if (node.nodeDefUuid === ancestorDefUuid) return node

  let ancestor = getParent(node)(record)
  while (ancestor && ancestor.nodeDefUuid !== ancestorDefUuid) {
    ancestor = getParent(ancestor)(record)
  }
  if (!ancestor) {
    throw new SystemError('record.ancestorNotFound', {
      nodeUuid: node.uuid,
      nodeDefUuid: node.nodeDefUuid,
      ancestorDefUuid,
    })
  }
  return ancestor
}

/**
 * Returns the list of ancestors from the given node to the root entity
 */
export const getAncestorsAndSelf = (params: { record: Record; node: Node }): Array<Node> => {
  const { record, node } = params
  const ancestors: Array<Node> = []
  visitAncestorsAndSelf(node, (currentNode) => {
    ancestors.push(currentNode)
  })(record)
  return ancestors
}

// descendants

export const getDescendantsOrSelf = (params: {
  record: Record
  node: Node
  nodeDefDescendant: NodeDef<any>
}): Node[] => {
  const { record, node, nodeDefDescendant } = params

  if (nodeDefDescendant.uuid === node.nodeDefUuid) return [node]

  const nodeDefDescendantFullHierarchy = [...nodeDefDescendant.meta.h, nodeDefDescendant.uuid]

  // 1. get the descendant node defs uuids starting from node nodeDefUuid (not inclusive) down to the specified nodeDefDescendant uuid
  const descendantNodeDefUuids = nodeDefDescendantFullHierarchy.slice(
    nodeDefDescendantFullHierarchy.indexOf(node.nodeDefUuid) + 1
  )
  // 2. for every level in the hierarchy, find the children having the nodeDefUuid equal to the current one
  let currentAncestors = [node]
  let currentDescendants: Node[] = []
  descendantNodeDefUuids.forEach((currentDescendantDefUuid) => {
    currentAncestors.forEach((currentAncestor) => {
      currentDescendants.push(...getChildren(currentAncestor, currentDescendantDefUuid)(record))
    })
    currentAncestors = currentDescendants
    currentDescendants = []
  })
  return currentAncestors // currentAncestors is equal to the currentDescendants of the last level
}

export const getDescendant = (params: { record: Record; node: Node; nodeDefDescendant: NodeDef<any> }): Node => {
  const { record, node, nodeDefDescendant } = params

  return getDescendantsOrSelf({ record, node, nodeDefDescendant })[0]
}

export const isDescendantOf = (params: { node: Node; ancestor: Node }): boolean => {
  const { node, ancestor } = params
  return Nodes.getHierarchy(node).includes(ancestor.uuid)
}

export const visitDescendantsAndSelf = (params: {
  record: Record
  node: Node
  visitor: (node: Node) => void
}): void => {
  const { record, node, visitor } = params
  const queue = new Queue()

  queue.enqueue(node)

  while (!queue.isEmpty()) {
    const visitedNode = queue.dequeue()

    visitor(visitedNode)

    const children = getChildren(visitedNode)(record)
    queue.enqueueItems(children)
  }
}

export const getCommonParentNode = (params: {
  record: Record
  node: Node
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
  dependentDef: NodeDef<NodeDefType, NodeDefProps>
}): Node | undefined => {
  const { record, node, nodeDef, dependentDef } = params
  // 1 find common parent def
  const commonParentDefUuid = Arrays.last(Arrays.intersection(nodeDef.meta.h, dependentDef.meta.h))
  if (!commonParentDefUuid) return undefined

  // 2 get ancestor node with common parent def
  return getAncestor({ record, node, ancestorDefUuid: commonParentDefUuid })
}

export const getEntityKeyNodes = (params: { survey: Survey; record: Record; entity: Node }): Node[] => {
  const { survey, record, entity } = params
  const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: entity.nodeDefUuid })
  const nodeDefKeys = Surveys.getNodeDefKeys({ survey, nodeDef })
  return nodeDefKeys.map((nodeDefKey) => getChild(entity, nodeDefKey.uuid)(record))
}

export const getEntityKeyValues = (params: { survey: Survey; record: Record; entity: Node }): Node[] => {
  const { survey, record, entity } = params
  return getEntityKeyNodes({ survey, record, entity }).map((node) => node.value)
}

export const getNodeSiblings = (params: {
  record: Record
  node: Node
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
}) => {
  const { record, node, nodeDef } = params
  const parentEntity = getParent(node)(record)
  if (!parentEntity) return []
  const ancestorEntity = getParent(parentEntity)(record)
  if (!ancestorEntity) return []
  const siblingParentEntities = getChildren(ancestorEntity, nodeDef.parentUuid)(record)

  return siblingParentEntities.reduce(
    (siblingsAcc: Node[], siblingEntity) => [...siblingsAcc, ...getChildren(siblingEntity, nodeDef.uuid)(record)],
    []
  )
}

export const getDependentNodePointers = (params: {
  survey: Survey
  record: Record
  node: Node
  dependencyType: SurveyDependencyType
  includeSelf?: boolean
  filterFn?: (nodePointer: NodePointer) => boolean
}) => {
  const { survey, record, node, dependencyType, includeSelf = false, filterFn = null } = params
  const nodeDefUuid = node.nodeDefUuid
  const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: nodeDefUuid })
  const dependentDefs = Surveys.getNodeDefDependents({ survey, nodeDefUuid, dependencyType })
  const nodePointers: Array<NodePointer> = []

  for (const dependentDef of dependentDefs) {
    // 1 find common parent node
    const commonParentNode = getCommonParentNode({ record, node, nodeDef, dependentDef })
    if (!commonParentNode) continue

    const nodeDefDependentParent = Surveys.getNodeDefParent({ survey, nodeDef: dependentDef })
    if (!nodeDefDependentParent) throw new SystemError('record.nodes.dependents.dependencyOnRootFound')

    // 2 find descendant nodes of common parent node with nodeDefUuid = dependentDef uuid
    const dependentContextNodes = getDescendantsOrSelf({
      record,
      node: commonParentNode,
      nodeDefDescendant: nodeDefDependentParent,
    })

    dependentContextNodes.forEach((dependentContextNode) => {
      const nodePointer = {
        nodeCtx: dependentContextNode,
        nodeDef: dependentDef,
      }
      if (filterFn === null || filterFn(nodePointer)) {
        nodePointers.push(nodePointer)
      }
    })
  }
  if (includeSelf) {
    const parentNode = getParent(node)(record)
    if (parentNode) {
      const nodePointerSelf: NodePointer = {
        nodeCtx: parentNode,
        nodeDef,
      }
      if (filterFn === null || filterFn(nodePointerSelf)) {
        nodePointers.push(nodePointerSelf)
      }
    }
  }

  return nodePointers
}

export const getAncestorCodePath = (params: {
  survey: Survey
  record: Record
  parentNode: Node
  nodeDef: NodeDef<NodeDefType.code, NodeDefCodeProps>
}): string[] => {
  const { record, parentNode, nodeDef, survey } = params

  const getCodeAttributeItemCode = (codeAttribute: Node | undefined): string => {
    const codeItemUuid = codeAttribute ? NodeValues.getItemUuid(codeAttribute) : undefined
    if (!codeItemUuid) return ''
    const item = Surveys.getCategoryItemByUuid({ survey, itemUuid: codeItemUuid })
    return item?.props.code || ''
  }

  const codePaths = []
  let currentParentCodeAttribute = getParentCodeAttribute({ parentNode, nodeDef })(record)

  while (currentParentCodeAttribute) {
    const ancestorItemCode = getCodeAttributeItemCode(currentParentCodeAttribute)
    codePaths.unshift(ancestorItemCode)
    const ancestorCodeDef = Surveys.getNodeDefByUuid({
      survey,
      uuid: currentParentCodeAttribute.nodeDefUuid,
    }) as NodeDefCode
    currentParentCodeAttribute = getParentCodeAttribute({ parentNode, nodeDef: ancestorCodeDef })(record)
  }
  return codePaths
}

export const getCategoryItemUuid = (params: {
  survey: Survey
  nodeDef: NodeDef<NodeDefType.code, NodeDefCodeProps>
  record: Record
  parentNode: Node
  code: string
}): string | undefined => {
  const { survey, nodeDef, record, parentNode, code } = params
  const categoryUuid = nodeDef.props.categoryUuid

  const codePaths = [...getAncestorCodePath({ survey, record, parentNode, nodeDef }), code]

  const item = Surveys.getCategoryItemByCodePaths({ survey, categoryUuid, codePaths })

  return item?.uuid
}
