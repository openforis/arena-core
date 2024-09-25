import { TraverseMethod } from '../../common'
import { NodeDef, NodeDefCode, NodeDefCodeProps, NodeDefProps, NodeDefType, NodeDefs } from '../../nodeDef'
import { Node, NodePointer, Nodes, NodesMap } from '../../node'
import { Record } from '../record'
import { defaultCycle, Surveys } from '../../survey'
import { Arrays, Queue } from '../../utils'
import { Survey, SurveyDependencyType } from '../../survey/survey'
import { SystemError } from '../../error'
import { NodeValues } from '../../node/nodeValues'
import { RecordNodesIndexReader } from './recordNodesIndexReader'

export const getCycle = (record: Record): string => record.cycle ?? defaultCycle

export const getNodes = (record: Record): { [key: string]: Node } => record.nodes ?? {}

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

    const parentCodeDefUuid = NodeDefs.getParentCodeDefUuid(nodeDef)
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

export const getAncestor = (params: { record: Record; node: Node; ancestorDefUuid: string }): Node | undefined => {
  const { record, node, ancestorDefUuid } = params
  if (node.nodeDefUuid === ancestorDefUuid) return node

  let ancestor = getParent(node)(record)
  while (ancestor && ancestor.nodeDefUuid !== ancestorDefUuid) {
    ancestor = getParent(ancestor)(record)
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
  traverseMethod?: TraverseMethod
}): void => {
  const { record, node, visitor, traverseMethod = TraverseMethod.bfs } = params

  if (traverseMethod === TraverseMethod.bfs) {
    const queue = new Queue()

    queue.enqueue(node)

    while (!queue.isEmpty()) {
      const visitedNode = queue.dequeue()

      visitor(visitedNode)

      const children = getChildren(visitedNode)(record)
      queue.enqueueItems(children)
    }
  } else {
    const stack = []

    stack.push(node)

    while (stack.length > 0) {
      const visitedNode = stack.pop() as Node

      visitor(visitedNode)

      const children = getChildren(visitedNode)(record)

      // add children to stack in reverse order
      for (let index = children.length - 1; index >= 0; index--) {
        const child = children[index]
        stack.push(child)
      }
    }
  }
}

const getClosestAncestorNode = (params: {
  record: Record
  node: Node
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
  dependentDef: NodeDef<NodeDefType, NodeDefProps>
}): Node | undefined => {
  const { record, node, nodeDef, dependentDef } = params

  // 1a if dependent def is the same as node def, potentially all nodes with
  // nodeDefUuid === dependentDef.uuid in record could be dependent of nodeDef;
  // consider the root node as the closest ancestor node
  if (nodeDef.uuid === dependentDef.uuid) {
    return getRoot(record)
  }
  // 1 find common ancestor def
  const commonAncestorDefUuid = Arrays.last(Arrays.intersection(nodeDef.meta.h, dependentDef.meta.h))
  if (!commonAncestorDefUuid) return undefined

  // 2 get ancestor node with common parent def
  return getAncestor({ record, node, ancestorDefUuid: commonAncestorDefUuid })
}

export const getEntityKeyNodesByDefUuid = (params: {
  survey: Survey
  cycle?: string
  record: Record
  entity: Node
}): NodesMap => {
  const { survey, cycle, record, entity } = params
  const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: entity.nodeDefUuid })
  const nodeDefKeys = Surveys.getNodeDefKeys({ survey, cycle, nodeDef })
  return nodeDefKeys.reduce((acc: NodesMap, nodeDefKey) => {
    const nodeKey = getDescendant({ record, node: entity, nodeDefDescendant: nodeDefKey })
    acc[nodeDefKey.uuid] = nodeKey
    return acc
  }, {})
}

export const getEntityKeyNodes = (params: { survey: Survey; cycle?: string; record: Record; entity: Node }): Node[] =>
  Object.values(getEntityKeyNodesByDefUuid(params))

export const getEntityKeyValuesByDefUuid = (params: {
  survey: Survey
  cycle?: string
  record: Record
  entity: Node
}): { [key: string]: any } => {
  const keyNodesByDefUuid = getEntityKeyNodesByDefUuid(params)
  return Object.entries(keyNodesByDefUuid).reduce((acc: { [key: string]: any }, [uuid, keyNode]) => {
    acc[uuid] = keyNode?.value
    return acc
  }, {})
}

export const getEntityKeyValues = (params: { survey: Survey; cycle?: string; record: Record; entity: Node }): any[] =>
  Object.values(getEntityKeyValuesByDefUuid(params))

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

export const getNodeIndex = (params: { record: Record; node: Node }) => {
  const { record, node } = params
  const parentEntity = getParent(node)(record)
  if (!parentEntity) return 0 // root entity
  const siblings = getChildren(parentEntity, node.nodeDefUuid)(record)
  return siblings.indexOf(node)
}

export const findEntityByKeyValues = (params: {
  survey: Survey
  cycle: string
  record: Record
  parentEntity: Node
  entityDefUuid: string
  keyValuesByDefUuid: { [key: string]: any }
}): Node | undefined => {
  const { survey, cycle, record, parentEntity, entityDefUuid, keyValuesByDefUuid } = params
  const entityDef = Surveys.getNodeDefByUuid({ survey, uuid: entityDefUuid })
  const siblingEntities = getChildren(parentEntity, entityDefUuid)(record)
  if (NodeDefs.isSingle(entityDef)) {
    return siblingEntities[0]
  }
  const keyDefs = Surveys.getNodeDefKeys({ survey, cycle, nodeDef: entityDef })

  return siblingEntities.find((siblingEntity) => {
    const siblingEntityKeyValuesByDefUuid = getEntityKeyValuesByDefUuid({
      survey,
      cycle,
      record,
      entity: siblingEntity,
    })
    return keyDefs.every((keyDef) => {
      const keyValue = siblingEntityKeyValuesByDefUuid[keyDef.uuid]
      const keyValueSearch = keyValuesByDefUuid[keyDef.uuid]
      return NodeValues.isValueEqual({
        survey,
        nodeDef: keyDef,
        value: keyValue,
        valueSearch: keyValueSearch,
      })
    })
  })
}

export const findEntityWithSameKeysInAnotherRecord = (params: {
  survey: Survey
  cycle: string
  entityUuid: string
  record: Record
  recordOther: Record
}): Node | undefined => {
  const { survey, cycle, entityUuid, record, recordOther } = params
  const entity = getNodeByUuid(entityUuid)(record)
  if (!entity) return undefined

  let otherRecordCurrentParentEntity = getRoot(recordOther)
  if (!otherRecordCurrentParentEntity) return undefined

  const entityAncestorsAndSelf = getAncestorsAndSelf({
    record,
    node: entity,
  })
  const ancestorDefUuidsAndKeys = entityAncestorsAndSelf.map((ancestor) => ({
    entityDefUuid: ancestor.nodeDefUuid,
    keyValuesByDefUuid: getEntityKeyValuesByDefUuid({
      survey,
      record,
      entity: ancestor,
    }),
  }))

  const ancestorDefUuidsAndKeysToVisit = [...ancestorDefUuidsAndKeys].reverse()

  for (let index = 1; otherRecordCurrentParentEntity && index < ancestorDefUuidsAndKeysToVisit.length; index++) {
    const { entityDefUuid, keyValuesByDefUuid } = ancestorDefUuidsAndKeysToVisit[index]
    otherRecordCurrentParentEntity = findEntityByKeyValues({
      survey,
      cycle,
      record: recordOther,
      parentEntity: otherRecordCurrentParentEntity,
      entityDefUuid,
      keyValuesByDefUuid,
    })
  }
  return otherRecordCurrentParentEntity
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

  const addToNodePointers = (nodePointer: NodePointer): void => {
    if (filterFn === null || filterFn(nodePointer)) {
      nodePointers.push(nodePointer)
    }
  }

  for (const dependentDef of dependentDefs) {
    // 1 find common ancestor node
    const commonAncestorNode = getClosestAncestorNode({ record, node, nodeDef, dependentDef })
    if (!commonAncestorNode) continue

    const nodeDefDependentParent = Surveys.getNodeDefParent({ survey, nodeDef: dependentDef })
    if (!nodeDefDependentParent) throw new SystemError('record.nodes.dependents.dependencyOnRootFound')

    // 2 find descendant nodes of common parent node with nodeDefUuid = dependentDef uuid
    const dependentContextNodes = getDescendantsOrSelf({
      record,
      node: commonAncestorNode,
      nodeDefDescendant: nodeDefDependentParent,
    })

    dependentContextNodes.forEach((dependentContextNode) => {
      addToNodePointers({
        nodeCtx: dependentContextNode,
        nodeDef: dependentDef,
      })
    })
  }
  if (includeSelf) {
    const parentNode = getParent(node)(record)
    if (parentNode) {
      addToNodePointers({
        nodeCtx: parentNode,
        nodeDef,
      })
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
    return item?.props.code ?? ''
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
