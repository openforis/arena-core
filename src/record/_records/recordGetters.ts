import { Dictionary, TraverseMethod } from '../../common'
import { SystemError, SystemErrorKeys } from '../../error'
import { ArenaRecordNode, NodePointer, Nodes, NodesMap } from '../../node'
import { NodeValues } from '../../node/nodeValues'
import { NodeDef, NodeDefCode, NodeDefCodeProps, NodeDefProps, NodeDefs, NodeDefType } from '../../nodeDef'
import { defaultCycle, Surveys } from '../../survey'
import { Survey, SurveyDependencyType } from '../../survey/survey'
import { Arrays, Queue } from '../../utils'
import { ArenaRecord, RECORD_STEP_DEFAULT } from '../record'
import { RecordStepAnalysisCode } from '../recordStep'
import { RecordNodesIndexReader } from './recordNodesIndexReader'
import { NodeDefSelfReferences } from './nodeDefSelfReferences'

export const getCycle = (record: ArenaRecord): string => record.cycle ?? defaultCycle

export const getNodes = (record: ArenaRecord): Dictionary<ArenaRecordNode> => record.nodes ?? {}

export const getNodesArray = (record: ArenaRecord): ArenaRecordNode[] => Object.values(getNodes(record))

/**
 * Returns the node with the specified uuid, or undefined if not found.
 * Like the other node getters, it does not throw an error when the node is not found.
 */
export const getNodeByUuid =
  (uuid: string) =>
  (record: ArenaRecord): ArenaRecordNode | undefined =>
    record.nodes?.[uuid]

export const getNodesByUuids =
  (uuids: string[]) =>
  (record: ArenaRecord): ArenaRecordNode[] =>
    uuids.map((uuid: string) => record.nodes?.[uuid]) as ArenaRecordNode[]

/**
 * Returns the root node, or undefined if the record has no nodes.
 */
export const getRoot = (record: ArenaRecord): ArenaRecordNode | undefined => {
  const rootUuid = record._nodesIndex ? RecordNodesIndexReader.getNodeRootUuid(record._nodesIndex) : null
  if (rootUuid) {
    return getNodeByUuid(rootUuid)(record)
  }
  return getNodesArray(record).find((node) => !node.parentUuid)
}

export const getChildren =
  (parentNode: ArenaRecordNode, childDefUuid?: string) =>
  (record: ArenaRecord): ArenaRecordNode[] => {
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

/**
 * Returns the only child of the parent node with the specified node def, or undefined if not found.
 * Throws an error if more than one child is found.
 */
export const getChild =
  (parentNode: ArenaRecordNode, childDefUuid: string) =>
  (record: ArenaRecord): ArenaRecordNode | undefined => {
    const children = getChildren(parentNode, childDefUuid)(record)
    if (children.length > 1) {
      const errorParams = { childDefUuid, parentNodeUuid: parentNode.uuid, recordUuid: record.uuid }
      throw new SystemError(SystemErrorKeys.record.multipleNodesFound, errorParams)
    }
    return children[0]
  }

// called for every ancestor in the record update loops: keep it a plain lookup
const getParentNode = (record: ArenaRecord, node: ArenaRecordNode): ArenaRecordNode | undefined =>
  node.parentUuid ? record.nodes?.[node.parentUuid] : undefined

export const getParent =
  (node: ArenaRecordNode) =>
  (record: ArenaRecord): ArenaRecordNode | undefined =>
    getParentNode(record, node)

export const getNodesByDefUuid =
  (nodeDefUuid: string) =>
  (record: ArenaRecord): ArenaRecordNode[] => {
    if (record._nodesIndex) {
      const nodeUuids = RecordNodesIndexReader.getNodeUuidsByDef(nodeDefUuid)(record._nodesIndex)
      return getNodesByUuids(nodeUuids)(record)
    }
    return getNodesArray(record).filter((node) => node.nodeDefUuid === nodeDefUuid)
  }

const isNodeFlagTrue =
  (isChildFlagTrue: (parent: ArenaRecordNode, nodeDefUuid: string) => boolean) =>
  (node: ArenaRecordNode) =>
  (record: ArenaRecord): boolean => {
    let child = node
    let parent = getParentNode(record, child)
    while (parent) {
      if (!isChildFlagTrue(parent, child.nodeDefUuid)) return false
      child = parent
      parent = getParentNode(record, child)
    }
    return true
  }

export const isNodeApplicable = isNodeFlagTrue((parent, nodeDefUuid) => Nodes.isChildApplicable(parent, nodeDefUuid))
export const isNodeEditable = isNodeFlagTrue((parent, nodeDefUuid) => Nodes.isChildEditable(parent, nodeDefUuid))
export const isNodeVisible = isNodeFlagTrue((parent, nodeDefUuid) => Nodes.isChildVisible(parent, nodeDefUuid))

/**
 * Whether a value is required for the node: key or always required attribute, or attribute with a "required if"
 * condition met in its parent entity (evaluated condition stored in the parent node meta).
 * Returns false when the condition has not been evaluated yet.
 */
export const isNodeRequired =
  (nodeDef: NodeDef<NodeDefType>, node: ArenaRecordNode) =>
  (record: ArenaRecord): boolean => {
    if (NodeDefs.isKey(nodeDef) || NodeDefs.isRequired(nodeDef)) return true
    if (!NodeDefs.isRequiredIfDefined(nodeDef)) return false
    const parent = getParentNode(record, node)
    return !!parent && Nodes.getChildRequired(parent, nodeDef.uuid) === true
  }

export const getDependentCodeAttributes =
  (node: ArenaRecordNode) =>
  (record: ArenaRecord): ArenaRecordNode[] => {
    if (record._nodesIndex) {
      const nodeUuids = RecordNodesIndexReader.getNodeCodeDependentUuids(node.uuid)(record._nodesIndex)
      return getNodesByUuids(nodeUuids)(record)
    }
    throw new SystemError(SystemErrorKeys.record.nodesIndexNotInitialized)
  }

export const getParentCodeAttribute =
  (parentNode: ArenaRecordNode, nodeDef: NodeDefCode) =>
  (record: ArenaRecord): ArenaRecordNode | undefined => {
    const parentCodeDefUuid = NodeDefs.getParentCodeDefUuid(nodeDef)
    if (!parentCodeDefUuid) return undefined

    const ancestors = getAncestorsAndSelf(parentNode)(record)
    for (const ancestor of ancestors) {
      const children = getChildren(ancestor, parentCodeDefUuid)(record)
      if (children.length === 1) {
        return children[0]
      }
    }
    return undefined
  }

// ancestors

/**
 * Visits the specified node and its ancestors, from the node up to the root: the visit stops when the visitor returns true.
 */
export const visitAncestorsAndSelf =
  (node: ArenaRecordNode, visitor: (node: ArenaRecordNode) => boolean | void) =>
  (record: ArenaRecord): void => {
    let currentNode: ArenaRecordNode | undefined = node
    while (currentNode) {
      if (visitor(currentNode)) return
      currentNode = getParentNode(record, currentNode)
    }
  }

/**
 * Returns the first node satisfying the predicate among the specified node and its ancestors (from the node up to the root).
 */
export const findAncestor =
  (node: ArenaRecordNode, predicate: (node: ArenaRecordNode) => boolean) =>
  (record: ArenaRecord): ArenaRecordNode | undefined => {
    let result: ArenaRecordNode | undefined = undefined
    visitAncestorsAndSelf(node, (visitedNode) => {
      if (predicate(visitedNode)) {
        result = visitedNode
        return true
      }
      return false
    })(record)
    return result
  }

/**
 * Returns the specified node, if it has the specified node def, or its ancestor with that node def; undefined if not found.
 */
export const getAncestor =
  (node: ArenaRecordNode, ancestorDefUuid: string) =>
  (record: ArenaRecord): ArenaRecordNode | undefined => {
    let ancestor: ArenaRecordNode | undefined = node
    while (ancestor && ancestor.nodeDefUuid !== ancestorDefUuid) {
      ancestor = getParentNode(record, ancestor)
    }
    return ancestor
  }

/**
 * Returns the list of ancestors from the given node to the root entity
 */
export const getAncestorsAndSelf =
  (node: ArenaRecordNode) =>
  (record: ArenaRecord): Array<ArenaRecordNode> => {
    const ancestors: Array<ArenaRecordNode> = []
    let currentNode: ArenaRecordNode | undefined = node
    while (currentNode) {
      ancestors.push(currentNode)
      currentNode = getParentNode(record, currentNode)
    }
    return ancestors
  }

// descendants

export const getDescendantsOrSelf =
  (node: ArenaRecordNode, nodeDefDescendant: NodeDef<any>) =>
  (record: ArenaRecord): ArenaRecordNode[] => {
    if (nodeDefDescendant.uuid === node.nodeDefUuid) return [node]

    const nodeDefDescendantFullHierarchy = [...nodeDefDescendant.meta.h, nodeDefDescendant.uuid]

    // 1. get the descendant node defs uuids starting from node nodeDefUuid (not inclusive) down to the specified nodeDefDescendant uuid
    const descendantNodeDefUuids = nodeDefDescendantFullHierarchy.slice(
      nodeDefDescendantFullHierarchy.indexOf(node.nodeDefUuid) + 1
    )
    // 2. for every level in the hierarchy, find the children having the nodeDefUuid equal to the current one
    let currentAncestors = [node]
    let currentDescendants: ArenaRecordNode[] = []
    for (const currentDescendantDefUuid of descendantNodeDefUuids) {
      for (const currentAncestor of currentAncestors) {
        currentDescendants.push(...getChildren(currentAncestor, currentDescendantDefUuid)(record))
      }
      currentAncestors = currentDescendants
      currentDescendants = []
    }
    return currentAncestors // currentAncestors is equal to the currentDescendants of the last level
  }

/**
 * Returns the first descendant (or the node itself) with the specified node def, or undefined if not found.
 */
export const getDescendant =
  (node: ArenaRecordNode, nodeDefDescendant: NodeDef<any>) =>
  (record: ArenaRecord): ArenaRecordNode | undefined =>
    getDescendantsOrSelf(node, nodeDefDescendant)(record)[0]

export const isDescendantOf = (node: ArenaRecordNode, ancestor: ArenaRecordNode): boolean =>
  Nodes.getHierarchy(node).includes(ancestor.uuid)

export const visitDescendantsAndSelf =
  (
    node: ArenaRecordNode,
    visitor: (node: ArenaRecordNode) => boolean | void,
    traverseMethod: TraverseMethod = TraverseMethod.bfs
  ) =>
  (record: ArenaRecord): void => {
    if (traverseMethod === TraverseMethod.bfs) {
      const queue = new Queue<ArenaRecordNode>()

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
        const visitedNode = stack.pop() as ArenaRecordNode

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
  (node: ArenaRecordNode, predicate: (node: ArenaRecordNode) => boolean) =>
  (record: ArenaRecord): ArenaRecordNode | undefined => {
    let found = undefined

    visitDescendantsAndSelf(node, (currentNode) => {
      if (predicate(currentNode)) {
        found = currentNode
        return true
      }
      return false
    })(record)
    return found
  }

const getClosestAncestorNode =
  (
    node: ArenaRecordNode,
    nodeDef: NodeDef<NodeDefType, NodeDefProps>,
    dependentDef: NodeDef<NodeDefType, NodeDefProps>,
    dependencyType: SurveyDependencyType
  ) =>
  (record: ArenaRecord): ArenaRecordNode | undefined => {
    // 1a if dependent def is the same as node def, potentially all nodes with
    // nodeDefUuid === dependentDef.uuid in record could be dependent of nodeDef;
    // consider the root node as the closest ancestor node,
    // unless the node def references itself only among the children of its parent entity (e.g. validation "dbh > 0")
    if (nodeDef.uuid === dependentDef.uuid) {
      return NodeDefSelfReferences.isSelfReferenceLocal({ nodeDef, dependencyType })
        ? getParent(node)(record)
        : getRoot(record)
    }
    // 1 find common ancestor def
    const commonAncestorDefUuid = Arrays.last(Arrays.intersection(nodeDef.meta.h, dependentDef.meta.h))
    if (!commonAncestorDefUuid) return undefined

    // 2 get ancestor node with common parent def
    return getAncestor(node, commonAncestorDefUuid)(record)
  }

type KeyDefs = NodeDef<NodeDefType, NodeDefProps>[]

/**
 * Returns the key nodes of the entity, indexed by key def uuid; keyDefs, when specified, are used instead of the
 * entity def keys in the cycle.
 */
export const getEntityKeyNodesByDefUuid =
  (survey: Survey, entity: ArenaRecordNode, cycle?: string, keyDefs?: KeyDefs) =>
  (record: ArenaRecord): NodesMap => {
    const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: entity.nodeDefUuid })
    const nodeDefKeys = keyDefs ?? Surveys.getNodeDefKeys({ survey, cycle, nodeDef })
    return nodeDefKeys.reduce((acc: NodesMap, nodeDefKey) => {
      const nodeKey = getDescendant(entity, nodeDefKey)(record)
      // missing key nodes are kept as undefined entries
      acc[nodeDefKey.uuid] = nodeKey as ArenaRecordNode
      return acc
    }, {})
  }

export const getEntityKeyNodes =
  (survey: Survey, entity: ArenaRecordNode, cycle?: string, keyDefs?: KeyDefs) =>
  (record: ArenaRecord): ArenaRecordNode[] =>
    Object.values(getEntityKeyNodesByDefUuid(survey, entity, cycle, keyDefs)(record))

export const getEntityKeyValuesByDefUuid =
  (survey: Survey, entity: ArenaRecordNode, cycle?: string, keyDefs?: KeyDefs) =>
  (record: ArenaRecord): Dictionary<any> => {
    const keyNodesByDefUuid = getEntityKeyNodesByDefUuid(survey, entity, cycle, keyDefs)(record)
    return Object.entries(keyNodesByDefUuid).reduce((acc: Dictionary<any>, [uuid, keyNode]) => {
      acc[uuid] = keyNode?.value
      return acc
    }, {})
  }

export const getEntityKeyValues =
  (survey: Survey, entity: ArenaRecordNode, cycle?: string, keyDefs?: KeyDefs) =>
  (record: ArenaRecord): any[] =>
    Object.values(getEntityKeyValuesByDefUuid(survey, entity, cycle, keyDefs)(record))

export const getEntitySiblings =
  (entity: ArenaRecordNode, includeSelf = false) =>
  (record: ArenaRecord): ArenaRecordNode[] => {
    const parentEntity = getParent(entity)(record)
    if (!parentEntity) return []
    const siblingEntities = getChildren(parentEntity, entity.nodeDefUuid)(record)
    return includeSelf ? siblingEntities : siblingEntities.filter((sibling) => !Nodes.areEqual(sibling, entity))
  }

export const getAttributeSiblings =
  (node: ArenaRecordNode, nodeDef: NodeDef<NodeDefType, NodeDefProps>) =>
  (record: ArenaRecord): ArenaRecordNode[] => {
    const parentEntity = getParent(node)(record)
    if (!parentEntity) return []
    const siblingParentEntities = getEntitySiblings(parentEntity)(record)
    return siblingParentEntities.reduce((siblingsAcc: ArenaRecordNode[], siblingEntity) => {
      siblingsAcc.push(...getChildren(siblingEntity, nodeDef.uuid)(record))
      return siblingsAcc
    }, [])
  }

export const getNodeIndex = (node: ArenaRecordNode) => (record: ArenaRecord) => {
  const parentEntity = getParent(node)(record)
  if (!parentEntity) return 0 // root entity
  const siblings = getChildren(parentEntity, node.nodeDefUuid)(record)
  return siblings.indexOf(node)
}

export const findEntityByKeyValues =
  (
    survey: Survey,
    cycle: string,
    parentEntity: ArenaRecordNode,
    entityDefUuid: string,
    keyValuesByDefUuid: Dictionary<any>
  ) =>
  (record: ArenaRecord): ArenaRecordNode | undefined => {
    const entityDef = Surveys.getNodeDefByUuid({ survey, uuid: entityDefUuid })
    const siblingEntities = getChildren(parentEntity, entityDefUuid)(record)
    if (NodeDefs.isSingle(entityDef)) {
      return siblingEntities[0]
    }
    const keyDefs = Surveys.getNodeDefKeys({ survey, cycle, nodeDef: entityDef })

    return siblingEntities.find((siblingEntity) => {
      const siblingEntityKeyValuesByDefUuid = getEntityKeyValuesByDefUuid(
        survey,
        siblingEntity,
        undefined,
        keyDefs
      )(record)
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

export const findEntityWithSameKeysInAnotherRecord =
  (survey: Survey, cycle: string, entityUuid: string, recordOther: ArenaRecord) =>
  (record: ArenaRecord): ArenaRecordNode | undefined => {
    const entity = getNodeByUuid(entityUuid)(record)
    if (!entity) return undefined

    let otherRecordCurrentParentEntity = getRoot(recordOther)
    if (!otherRecordCurrentParentEntity) return undefined

    const entityAncestorsAndSelf = getAncestorsAndSelf(entity)(record)
    const ancestorDefUuidsAndKeys = entityAncestorsAndSelf.map((ancestor) => ({
      entityDefUuid: ancestor.nodeDefUuid,
      keyValuesByDefUuid: getEntityKeyValuesByDefUuid(survey, ancestor)(record),
    }))

    const ancestorDefUuidsAndKeysToVisit = [...ancestorDefUuidsAndKeys].reverse()

    for (let index = 1; otherRecordCurrentParentEntity && index < ancestorDefUuidsAndKeysToVisit.length; index++) {
      const { entityDefUuid, keyValuesByDefUuid } = ancestorDefUuidsAndKeysToVisit[index]
      otherRecordCurrentParentEntity = findEntityByKeyValues(
        survey,
        cycle,
        otherRecordCurrentParentEntity,
        entityDefUuid,
        keyValuesByDefUuid
      )(recordOther)
    }
    return otherRecordCurrentParentEntity
  }

export const getDependentNodePointers =
  (
    survey: Survey,
    node: ArenaRecordNode,
    dependencyType: SurveyDependencyType,
    includeSelf = false,
    filterFn: ((nodePointer: NodePointer) => boolean) | null = null
  ) =>
  (record: ArenaRecord): NodePointer[] => {
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
      const commonAncestorNode = getClosestAncestorNode(node, nodeDef, dependentDef, dependencyType)(record)
      if (!commonAncestorNode) continue

      const nodeDefDependentParent = Surveys.getNodeDefParent({ survey, nodeDef: dependentDef })
      if (!nodeDefDependentParent) throw new SystemError(SystemErrorKeys.record.dependencyOnRootFound)

      // 2 find descendant nodes of common parent node with nodeDefUuid = dependentDef uuid
      const dependentContextNodes = getDescendantsOrSelf(commonAncestorNode, nodeDefDependentParent)(record)

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

export const getAncestorCodePath =
  (survey: Survey, parentNode: ArenaRecordNode, nodeDef: NodeDef<NodeDefType.code, NodeDefCodeProps>) =>
  (record: ArenaRecord): string[] => {
    const getCodeAttributeItemCode = (codeAttribute: ArenaRecordNode | undefined): string => {
      const codeItemUuid = codeAttribute ? NodeValues.getItemUuid(codeAttribute) : undefined
      if (!codeItemUuid) return ''
      const item = Surveys.getCategoryItemByUuid({ survey, itemUuid: codeItemUuid })
      return item?.props.code ?? ''
    }

    const codePaths = []
    let currentParentCodeAttribute = getParentCodeAttribute(parentNode, nodeDef)(record)

    while (currentParentCodeAttribute) {
      const ancestorItemCode = getCodeAttributeItemCode(currentParentCodeAttribute)
      codePaths.unshift(ancestorItemCode)
      const ancestorCodeDef = Surveys.getNodeDefByUuid({
        survey,
        uuid: currentParentCodeAttribute.nodeDefUuid,
      }) as NodeDefCode
      currentParentCodeAttribute = getParentCodeAttribute(parentNode, ancestorCodeDef)(record)
    }
    return codePaths
  }

export const getCategoryItemUuid =
  (survey: Survey, nodeDef: NodeDef<NodeDefType.code, NodeDefCodeProps>, parentNode: ArenaRecordNode, code: string) =>
  (record: ArenaRecord): string | undefined => {
    const categoryUuid = nodeDef.props.categoryUuid

    const codePaths = [...getAncestorCodePath(survey, parentNode, nodeDef)(record), code]

    const item = Surveys.getCategoryItemByCodePaths({ survey, categoryUuid, codePaths })

    return item?.uuid
  }

export const isNodeFilledByUser =
  (node: ArenaRecordNode) =>
  (record: ArenaRecord): boolean =>
    !!findDescendantOrSelf(node, (visitedNode) => Nodes.hasUserInputValue(visitedNode))(record)

export const isNodeEmpty =
  (node: ArenaRecordNode) =>
  (record: ArenaRecord): boolean =>
    !isNodeFilledByUser(node)(record)

export const isEmpty = (record: ArenaRecord): boolean => {
  const rootNode = getRoot(record)
  return rootNode ? isNodeEmpty(rootNode)(record) : true
}

export const getStep = (record: ArenaRecord): string => record.step ?? RECORD_STEP_DEFAULT

export const isInAnalysisStep = (record: ArenaRecord): boolean => getStep(record) === RecordStepAnalysisCode
