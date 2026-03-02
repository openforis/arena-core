import { Dictionary, TraverseMethod } from '../../common'
import { SystemError } from '../../error'
import { Node, NodePointer, Nodes } from '../../node'
import { NodeValues } from '../../node/nodeValues'
import { NodeDef, NodeDefCode, NodeDefCodeProps, NodeDefProps, NodeDefs, NodeDefType } from '../../nodeDef'
import { defaultCycle, Surveys } from '../../survey'
import { Survey, SurveyDependencyType } from '../../survey/survey'
import { Arrays, Queue } from '../../utils'
import { Record, RECORD_STEP_DEFAULT } from '../record'
import { RecordStepAnalysisCode } from '../recordStep'
import { RecordNodesIndexReader } from './recordNodesIndexReader'

export const getCycle = (record: Record): string => record.cycle ?? defaultCycle

export const getNodes = (record: Record): Dictionary<Node> => record.nodes ?? {}

export const getNodesArray = (record: Record): Node[] => Object.values(getNodes(record))

export const getNodeByInternalId =
  (internalId: number) =>
  (record: Record): Node | undefined =>
    record.nodes?.[internalId]

export const getNodesByInternalIds =
  (internalIds: number[]) =>
  (record: Record): Node[] =>
    internalIds.map((internalId: number) => getNodeByInternalId(internalId)(record)) as Node[]

export const getRoot = (record: Record): Node | undefined => {
  const rootInternalId = record._nodesIndex ? RecordNodesIndexReader.getNodeRootInternalId(record._nodesIndex) : null
  if (rootInternalId) {
    return getNodeByInternalId(rootInternalId)(record)
  }
  return getNodesArray(record).find((node) => !node.pIId)
}

export const getChildren =
  (parentNode: Node, childDefUuid?: string) =>
  (record: Record): Node[] => {
    if (record._nodesIndex) {
      const { iId: parentNodeInternalId } = parentNode
      const childrenIds = childDefUuid
        ? RecordNodesIndexReader.getNodeInternalIdsByParentAndChildDef({
            parentNodeInternalId,
            childDefUuid,
          })(record._nodesIndex)
        : RecordNodesIndexReader.getNodeInternalIdsByParent(parentNodeInternalId)(record._nodesIndex)
      return getNodesByInternalIds(childrenIds)(record)
    }
    return getNodesArray(record).filter(
      (node) => node.pIId === parentNode.iId && (!childDefUuid || node.nodeDefUuid == childDefUuid)
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
  (record: Record): Node | undefined => {
    const { pIId } = node
    if (!pIId) return undefined
    return getNodeByInternalId(pIId)(record)
  }

export const getNodesByDefUuid =
  (nodeDefUuid: string) =>
  (record: Record): Node[] => {
    if (record._nodesIndex) {
      const nodeInternalIds = RecordNodesIndexReader.getNodeInternalIdsByDef(nodeDefUuid)(record._nodesIndex)
      return getNodesByInternalIds(nodeInternalIds)(record)
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
      const dependentInternalIds = RecordNodesIndexReader.getNodeCodeDependentInternalIds(node.iId)(record._nodesIndex)
      return getNodesByInternalIds(dependentInternalIds)(record)
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
  (node: Node, visitor: (node: Node) => void, stopIfFn?: () => boolean) =>
  (record: Record): void => {
    let currentNode: Node | undefined = node
    while (currentNode) {
      visitor(currentNode)
      if (stopIfFn?.()) break
      currentNode = getParent(currentNode)(record)
    }
  }

export const findAncestor =
  (node: Node, predicate: (node: Node) => boolean) =>
  (record: Record): Node | undefined => {
    let result: Node | undefined = undefined
    visitAncestorsAndSelf(
      node,
      (visitedNode) => {
        if (predicate(visitedNode)) {
          result = visitedNode
        }
      },
      () => !!result
    )(record)
    return result
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
  for (const currentDescendantDefUuid of descendantNodeDefUuids) {
    for (const currentAncestor of currentAncestors) {
      currentDescendants.push(...getChildren(currentAncestor, currentDescendantDefUuid)(record))
    }
    currentAncestors = currentDescendants
    currentDescendants = []
  }
  return currentAncestors // currentAncestors is equal to the currentDescendants of the last level
}

export const getDescendant = (params: { record: Record; node: Node; nodeDefDescendant: NodeDef<any> }): Node => {
  const { record, node, nodeDefDescendant } = params

  return getDescendantsOrSelf({ record, node, nodeDefDescendant })[0]
}

export const isDescendantOf = (params: { node: Node; ancestor: Node }): boolean => {
  const { node, ancestor } = params
  return Nodes.getHierarchy(node).includes(ancestor.iId)
}

export const visitDescendantsAndSelf = (params: {
  record: Record
  node: Node
  visitor: (node: Node) => boolean | void
  traverseMethod?: TraverseMethod
}): void => {
  const { record, node, visitor, traverseMethod = TraverseMethod.bfs } = params

  if (traverseMethod === TraverseMethod.bfs) {
    const queue = new Queue<Node>()

    queue.enqueue(node)

    while (!queue.isEmpty()) {
      const visitedNode = queue.dequeue()!

      if (visitor(visitedNode)) {
        // stop if visitor returns true
        return
      }

      const children = getChildren(visitedNode)(record)
      queue.enqueueItems(children)
    }
  } else {
    const stack = []

    stack.push(node)

    while (stack.length > 0) {
      const visitedNode = stack.pop() as Node

      if (visitor(visitedNode)) {
        // stop if visitor returns true
        return
      }

      const children = getChildren(visitedNode)(record)

      // add children to stack in reverse order
      for (let index = children.length - 1; index >= 0; index--) {
        const child = children[index]
        stack.push(child)
      }
    }
  }
}

export const findDescendantOrSelf =
  (node: Node, predicate: (node: Node) => boolean) =>
  (record: Record): Node | undefined => {
    let found = undefined

    visitDescendantsAndSelf({
      record,
      node,
      visitor: (currentNode) => {
        if (predicate(currentNode)) {
          found = currentNode
          return true
        }
        return false
      },
    })
    return found
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

type EntityKeyNodesGetterParams = {
  survey: Survey
  cycle?: string
  record: Record
  entity: Node
  keyDefs?: NodeDef<NodeDefType, NodeDefProps>[]
}

export const getEntityKeyNodesByDefUuid = (params: EntityKeyNodesGetterParams): Dictionary<Node> => {
  const { survey, cycle, record, entity, keyDefs } = params
  const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: entity.nodeDefUuid })
  const nodeDefKeys = keyDefs ?? Surveys.getNodeDefKeys({ survey, cycle, nodeDef })
  return nodeDefKeys.reduce((acc: Dictionary<Node>, nodeDefKey) => {
    const nodeKey = getDescendant({ record, node: entity, nodeDefDescendant: nodeDefKey })
    acc[nodeDefKey.uuid] = nodeKey
    return acc
  }, {})
}

export const getEntityKeyNodes = (params: EntityKeyNodesGetterParams): Node[] =>
  Object.values(getEntityKeyNodesByDefUuid(params))

export const getEntityKeyValuesByDefUuid = (params: EntityKeyNodesGetterParams): Dictionary<any> => {
  const keyNodesByDefUuid = getEntityKeyNodesByDefUuid(params)
  return Object.entries(keyNodesByDefUuid).reduce((acc: Dictionary<any>, [uuid, keyNode]) => {
    acc[uuid] = keyNode?.value
    return acc
  }, {})
}

export const getEntityKeyValues = (params: EntityKeyNodesGetterParams): any[] =>
  Object.values(getEntityKeyValuesByDefUuid(params))

export const getEntitySiblings = (params: { record: Record; entity: Node; includeSelf?: boolean }) => {
  const { record, entity, includeSelf = false } = params
  const parentEntity = getParent(entity)(record)
  if (!parentEntity) return []
  const siblingEntities = getChildren(parentEntity, entity.nodeDefUuid)(record)
  return includeSelf ? siblingEntities : siblingEntities.filter((sibling) => !Nodes.areEqual(sibling, entity))
}

export const getAttributeSiblings = (params: {
  record: Record
  node: Node
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
}) => {
  const { record, node, nodeDef } = params
  const parentEntity = getParent(node)(record)
  if (!parentEntity) return []
  const siblingParentEntities = getEntitySiblings({ record, entity: parentEntity })
  return siblingParentEntities.reduce((siblingsAcc: Node[], siblingEntity) => {
    siblingsAcc.push(...getChildren(siblingEntity, nodeDef.uuid)(record))
    return siblingsAcc
  }, [])
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
  keyValuesByDefUuid: Dictionary<any>
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
      record,
      entity: siblingEntity,
      keyDefs,
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
  entityIId: number
  record: Record
  recordOther: Record
}): Node | undefined => {
  const { survey, cycle, entityIId, record, recordOther } = params
  const entity = getNodeByInternalId(entityIId)(record)
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
    for (const dependentContextNode of dependentContextNodes) {
      addToNodePointers({
        nodeCtx: dependentContextNode,
        nodeDef: dependentDef,
      })
    }
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

export const isNodeFilledByUser =
  (node: Node) =>
  (record: Record): boolean =>
    !!findDescendantOrSelf(node, (visitedNode) => Nodes.hasUserInputValue(visitedNode))(record)

export const isNodeEmpty =
  (node: Node) =>
  (record: Record): boolean =>
    !isNodeFilledByUser(node)(record)

export const isEmpty = (record: Record): boolean => {
  const rootNode = getRoot(record)
  return rootNode ? isNodeEmpty(rootNode)(record) : true
}

export const getStep = (record: Record): string => record.step ?? RECORD_STEP_DEFAULT

export const isInAnalysisStep = (record: Record): boolean => getStep(record) === RecordStepAnalysisCode
