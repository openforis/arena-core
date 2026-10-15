import { Dictionary, TraverseMethod } from '../../common'
import { SystemError } from '../../error'
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

export type RecordParams = { record: ArenaRecord }

/**
 * Record getter: takes the parameters first and the record as separate (curried) parameter: `getter(params)(record)`.
 * The deprecated form, with the record inside the parameters (`getter({ record, ...params })`), is still supported.
 */
export type RecordGetter<P extends RecordParams, R> = {
  /** @deprecated Pass the record as separate parameter: `getter(params)(record)` */
  (params: P): R
  (params: Omit<P, 'record'>): (record: ArenaRecord) => R
}

const isRecordParams = (params: object): params is RecordParams => 'record' in params

const recordGetter = <P extends RecordParams, R>(getter: (params: P) => R): RecordGetter<P, R> =>
  ((params: P | Omit<P, 'record'>) =>
    isRecordParams(params)
      ? getter(params as P)
      : (record: ArenaRecord) => getter({ ...params, record } as P)) as RecordGetter<P, R>

/**
 * Record getter (with parameters object) that also supports the deprecated form with positional parameters:
 * `getter(arg1, arg2)(record)`.
 */
export type PositionalRecordGetter<P, A extends unknown[], R> = {
  (params: P): (record: ArenaRecord) => R
  /** @deprecated Pass the parameters as an object: `getter({ ...params })(record)` */
  (...args: A): (record: ArenaRecord) => R
}

const positionalRecordGetter = <P, A extends unknown[], R>(params: {
  getter: (params: P & RecordParams) => R
  isPositional: (firstArg: unknown) => boolean
  toParams: (...args: A) => NoInfer<P>
}): PositionalRecordGetter<P, A, R> => {
  const { getter, isPositional, toParams } = params
  return ((...args: unknown[]) => {
    const getterParams = isPositional(args[0]) ? toParams(...(args as A)) : (args[0] as P)
    return (record: ArenaRecord) => getter({ ...getterParams, record })
  }) as PositionalRecordGetter<P, A, R>
}

const isRecordNode = (arg: unknown): arg is ArenaRecordNode =>
  typeof arg === 'object' && arg !== null && 'uuid' in arg && 'nodeDefUuid' in arg
const isString = (arg: unknown): arg is string => typeof arg === 'string'

export const getCycle = (record: ArenaRecord): string => record.cycle ?? defaultCycle

export const getNodes = (record: ArenaRecord): Dictionary<ArenaRecordNode> => record.nodes ?? {}

export const getNodesArray = (record: ArenaRecord): ArenaRecordNode[] => Object.values(getNodes(record))

/**
 * Returns the node with the specified uuid, or undefined if not found.
 * Like the other node getters, it does not throw an error when the node is not found.
 */
export const getNodeByUuid = positionalRecordGetter({
  getter: ({ record, uuid }: RecordParams & { uuid: string }): ArenaRecordNode | undefined => record.nodes?.[uuid],
  isPositional: isString,
  toParams: (uuid: string) => ({ uuid }),
})

export const getNodesByUuids = positionalRecordGetter({
  getter: ({ record, uuids }: RecordParams & { uuids: string[] }): ArenaRecordNode[] =>
    uuids.map((uuid: string) => record.nodes?.[uuid]) as ArenaRecordNode[],
  isPositional: Array.isArray,
  toParams: (uuids: string[]) => ({ uuids }),
})

/**
 * Returns the root node, or undefined if the record has no nodes.
 */
export const getRoot = (record: ArenaRecord): ArenaRecordNode | undefined => {
  const rootUuid = record._nodesIndex ? RecordNodesIndexReader.getNodeRootUuid(record._nodesIndex) : null
  if (rootUuid) {
    return getNodeByUuid({ uuid: rootUuid })(record)
  }
  return getNodesArray(record).find((node) => !node.parentUuid)
}

export const getChildren = positionalRecordGetter({
  getter: ({
    record,
    parentNode,
    childDefUuid,
  }: RecordParams & { parentNode: ArenaRecordNode; childDefUuid?: string }): ArenaRecordNode[] => {
    if (record._nodesIndex) {
      const childrenUuids = childDefUuid
        ? RecordNodesIndexReader.getNodeUuidsByParentAndChildDef({
            parentNodeUuid: parentNode.uuid,
            childDefUuid,
          })(record._nodesIndex)
        : RecordNodesIndexReader.getNodeUuidsByParent(parentNode.uuid)(record._nodesIndex)
      return getNodesByUuids({ uuids: childrenUuids })(record)
    }
    return getNodesArray(record).filter(
      (node) => node.parentUuid === parentNode.uuid && (!childDefUuid || node.nodeDefUuid == childDefUuid)
    )
  },
  isPositional: isRecordNode,
  toParams: (parentNode: ArenaRecordNode, childDefUuid?: string) => ({ parentNode, childDefUuid }),
})

/**
 * Returns the only child of the parent node with the specified node def, or undefined if not found.
 * Throws an error if more than one child is found.
 */
export const getChild = positionalRecordGetter({
  getter: ({
    record,
    parentNode,
    childDefUuid,
  }: RecordParams & { parentNode: ArenaRecordNode; childDefUuid: string }): ArenaRecordNode | undefined => {
    const children = getChildren({ parentNode, childDefUuid })(record)
    if (children.length > 1) {
      const errorParams = { childDefUuid, parentNodeUuid: parentNode.uuid, recordUuid: record.uuid }
      throw new SystemError('systemError.record.multipleNodesFound', errorParams)
    }
    return children[0]
  },
  isPositional: isRecordNode,
  toParams: (parentNode: ArenaRecordNode, childDefUuid: string) => ({ parentNode, childDefUuid }),
})

export const getParent = positionalRecordGetter({
  getter: ({ record, node }: RecordParams & { node: ArenaRecordNode }): ArenaRecordNode | undefined =>
    node.parentUuid ? getNodeByUuid({ uuid: node.parentUuid })(record) : undefined,
  isPositional: isRecordNode,
  toParams: (node: ArenaRecordNode) => ({ node }),
})

export const getNodesByDefUuid = positionalRecordGetter({
  getter: ({ record, nodeDefUuid }: RecordParams & { nodeDefUuid: string }): ArenaRecordNode[] => {
    if (record._nodesIndex) {
      const nodeUuids = RecordNodesIndexReader.getNodeUuidsByDef(nodeDefUuid)(record._nodesIndex)
      return getNodesByUuids({ uuids: nodeUuids })(record)
    }
    return getNodesArray(record).filter((node) => node.nodeDefUuid === nodeDefUuid)
  },
  isPositional: isString,
  toParams: (nodeDefUuid: string) => ({ nodeDefUuid }),
})

const isNodeFlagTrue = (isChildFlagTrue: (parent: ArenaRecordNode, nodeDefUuid: string) => boolean) =>
  recordGetter((params: RecordParams & { node: ArenaRecordNode }): boolean => {
    const { record, node } = params
    const ancestorsAndSelf = getAncestorsAndSelf({ node })(record)
    for (let i = 0; i < ancestorsAndSelf.length - 1; i++) {
      const child = ancestorsAndSelf[i]
      const parent = ancestorsAndSelf[i + 1]
      if (!isChildFlagTrue(parent, child.nodeDefUuid)) return false
    }
    return true
  })

export const isNodeApplicable = isNodeFlagTrue((parent, nodeDefUuid) => Nodes.isChildApplicable(parent, nodeDefUuid))
export const isNodeEditable = isNodeFlagTrue((parent, nodeDefUuid) => Nodes.isChildEditable(parent, nodeDefUuid))
export const isNodeVisible = isNodeFlagTrue((parent, nodeDefUuid) => Nodes.isChildVisible(parent, nodeDefUuid))

export const getDependentCodeAttributes = positionalRecordGetter({
  getter: ({ record, node }: RecordParams & { node: ArenaRecordNode }): ArenaRecordNode[] => {
    if (record._nodesIndex) {
      const nodeUuids = RecordNodesIndexReader.getNodeCodeDependentUuids(node.uuid)(record._nodesIndex)
      return getNodesByUuids({ uuids: nodeUuids })(record)
    }
    throw new SystemError('record.nodesIndexNotInitialized')
  },
  isPositional: isRecordNode,
  toParams: (node: ArenaRecordNode) => ({ node }),
})

export const getParentCodeAttribute =
  (params: { parentNode: ArenaRecordNode; nodeDef: NodeDefCode }) =>
  (record: ArenaRecord): ArenaRecordNode | undefined => {
    const { parentNode, nodeDef } = params

    const parentCodeDefUuid = NodeDefs.getParentCodeDefUuid(nodeDef)
    if (!parentCodeDefUuid) return undefined

    const ancestors = getAncestorsAndSelf({ node: parentNode })(record)
    for (const ancestor of ancestors) {
      const children = getChildren({ parentNode: ancestor, childDefUuid: parentCodeDefUuid })(record)
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
export const visitAncestorsAndSelf = positionalRecordGetter({
  getter: ({
    record,
    node,
    visitor,
  }: RecordParams & { node: ArenaRecordNode; visitor: (node: ArenaRecordNode) => boolean | void }): void => {
    let currentNode: ArenaRecordNode | undefined = node
    while (currentNode) {
      if (visitor(currentNode)) return
      currentNode = getParent({ node: currentNode })(record)
    }
  },
  isPositional: isRecordNode,
  // deprecated form: the visit stops when stopIfFn returns true
  toParams: (node: ArenaRecordNode, visitor: (node: ArenaRecordNode) => void, stopIfFn?: () => boolean) => ({
    node,
    visitor: (visitedNode: ArenaRecordNode): boolean => {
      visitor(visitedNode)
      return !!stopIfFn?.()
    },
  }),
})

/**
 * Returns the first node satisfying the predicate among the specified node and its ancestors (from the node up to the root).
 */
export const findAncestor =
  (params: { node: ArenaRecordNode; predicate: (node: ArenaRecordNode) => boolean }) =>
  (record: ArenaRecord): ArenaRecordNode | undefined => {
    const { node, predicate } = params
    let result: ArenaRecordNode | undefined = undefined
    visitAncestorsAndSelf({
      node,
      visitor: (visitedNode) => {
        if (predicate(visitedNode)) {
          result = visitedNode
          return true
        }
        return false
      },
    })(record)
    return result
  }

/**
 * Returns the specified node, if it has the specified node def, or its ancestor with that node def; undefined if not found.
 */
export const getAncestor = recordGetter(
  (params: { record: ArenaRecord; node: ArenaRecordNode; ancestorDefUuid: string }): ArenaRecordNode | undefined => {
    const { record, node, ancestorDefUuid } = params
    if (node.nodeDefUuid === ancestorDefUuid) return node

    let ancestor = getParent({ node })(record)
    while (ancestor && ancestor.nodeDefUuid !== ancestorDefUuid) {
      ancestor = getParent({ node: ancestor })(record)
    }
    return ancestor
  }
)

/**
 * Returns the list of ancestors from the given node to the root entity
 */
export const getAncestorsAndSelf = recordGetter(
  (params: { record: ArenaRecord; node: ArenaRecordNode }): Array<ArenaRecordNode> => {
    const { record, node } = params
    const ancestors: Array<ArenaRecordNode> = []
    visitAncestorsAndSelf({
      node,
      visitor: (currentNode) => {
        ancestors.push(currentNode)
      },
    })(record)
    return ancestors
  }
)

// descendants

export const getDescendantsOrSelf = recordGetter(
  (params: { record: ArenaRecord; node: ArenaRecordNode; nodeDefDescendant: NodeDef<any> }): ArenaRecordNode[] => {
    const { record, node, nodeDefDescendant } = params

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
        currentDescendants.push(
          ...getChildren({ parentNode: currentAncestor, childDefUuid: currentDescendantDefUuid })(record)
        )
      }
      currentAncestors = currentDescendants
      currentDescendants = []
    }
    return currentAncestors // currentAncestors is equal to the currentDescendants of the last level
  }
)

/**
 * Returns the first descendant (or the node itself) with the specified node def, or undefined if not found.
 */
export const getDescendant = recordGetter(
  (params: {
    record: ArenaRecord
    node: ArenaRecordNode
    nodeDefDescendant: NodeDef<any>
  }): ArenaRecordNode | undefined => {
    const { record, node, nodeDefDescendant } = params

    return getDescendantsOrSelf({ node, nodeDefDescendant })(record)[0]
  }
)

export const isDescendantOf = (params: { node: ArenaRecordNode; ancestor: ArenaRecordNode }): boolean => {
  const { node, ancestor } = params
  return Nodes.getHierarchy(node).includes(ancestor.uuid)
}

export const visitDescendantsAndSelf = recordGetter(
  (params: {
    record: ArenaRecord
    node: ArenaRecordNode
    visitor: (node: ArenaRecordNode) => boolean | void
    traverseMethod?: TraverseMethod
  }): void => {
    const { record, node, visitor, traverseMethod = TraverseMethod.bfs } = params

    if (traverseMethod === TraverseMethod.bfs) {
      const queue = new Queue<ArenaRecordNode>()

      queue.enqueue(node)

      while (!queue.isEmpty()) {
        const visitedNode = queue.dequeue()!

        if (visitor(visitedNode)) {
          // stop if visitor returns true
          return
        }

        const children = getChildren({ parentNode: visitedNode })(record)
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

        const children = getChildren({ parentNode: visitedNode })(record)

        // add children to stack in reverse order
        for (let index = children.length - 1; index >= 0; index--) {
          const child = children[index]
          stack.push(child)
        }
      }
    }
  }
)

export const findDescendantOrSelf =
  (params: { node: ArenaRecordNode; predicate: (node: ArenaRecordNode) => boolean }) =>
  (record: ArenaRecord): ArenaRecordNode | undefined => {
    const { node, predicate } = params
    let found = undefined

    visitDescendantsAndSelf({
      node,
      visitor: (currentNode) => {
        if (predicate(currentNode)) {
          found = currentNode
          return true
        }
        return false
      },
    })(record)
    return found
  }

const getClosestAncestorNode = recordGetter(
  (params: {
    record: ArenaRecord
    node: ArenaRecordNode
    nodeDef: NodeDef<NodeDefType, NodeDefProps>
    dependentDef: NodeDef<NodeDefType, NodeDefProps>
    dependencyType: SurveyDependencyType
  }): ArenaRecordNode | undefined => {
    const { record, node, nodeDef, dependentDef, dependencyType } = params

    // 1a if dependent def is the same as node def, potentially all nodes with
    // nodeDefUuid === dependentDef.uuid in record could be dependent of nodeDef;
    // consider the root node as the closest ancestor node,
    // unless the node def references itself only among the children of its parent entity (e.g. validation "dbh > 0")
    if (nodeDef.uuid === dependentDef.uuid) {
      return NodeDefSelfReferences.isSelfReferenceLocal({ nodeDef, dependencyType })
        ? getParent({ node })(record)
        : getRoot(record)
    }
    // 1 find common ancestor def
    const commonAncestorDefUuid = Arrays.last(Arrays.intersection(nodeDef.meta.h, dependentDef.meta.h))
    if (!commonAncestorDefUuid) return undefined

    // 2 get ancestor node with common parent def
    return getAncestor({ node, ancestorDefUuid: commonAncestorDefUuid })(record)
  }
)

type EntityKeyNodesGetterParams = {
  survey: Survey
  cycle?: string
  record: ArenaRecord
  entity: ArenaRecordNode
  keyDefs?: NodeDef<NodeDefType, NodeDefProps>[]
}

export const getEntityKeyNodesByDefUuid = recordGetter((params: EntityKeyNodesGetterParams): NodesMap => {
  const { survey, cycle, record, entity, keyDefs } = params
  const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: entity.nodeDefUuid })
  const nodeDefKeys = keyDefs ?? Surveys.getNodeDefKeys({ survey, cycle, nodeDef })
  return nodeDefKeys.reduce((acc: NodesMap, nodeDefKey) => {
    const nodeKey = getDescendant({ node: entity, nodeDefDescendant: nodeDefKey })(record)
    // missing key nodes are kept as undefined entries
    acc[nodeDefKey.uuid] = nodeKey as ArenaRecordNode
    return acc
  }, {})
})

export const getEntityKeyNodes = recordGetter(
  ({ record, ...otherParams }: EntityKeyNodesGetterParams): ArenaRecordNode[] =>
    Object.values(getEntityKeyNodesByDefUuid(otherParams)(record))
)

export const getEntityKeyValuesByDefUuid = recordGetter((params: EntityKeyNodesGetterParams): Dictionary<any> => {
  const { record, ...otherParams } = params
  const keyNodesByDefUuid = getEntityKeyNodesByDefUuid(otherParams)(record)
  return Object.entries(keyNodesByDefUuid).reduce((acc: Dictionary<any>, [uuid, keyNode]) => {
    acc[uuid] = keyNode?.value
    return acc
  }, {})
})

export const getEntityKeyValues = recordGetter(({ record, ...otherParams }: EntityKeyNodesGetterParams): any[] =>
  Object.values(getEntityKeyValuesByDefUuid(otherParams)(record))
)

export const getEntitySiblings = recordGetter(
  (params: { record: ArenaRecord; entity: ArenaRecordNode; includeSelf?: boolean }) => {
    const { record, entity, includeSelf = false } = params
    const parentEntity = getParent({ node: entity })(record)
    if (!parentEntity) return []
    const siblingEntities = getChildren({ parentNode: parentEntity, childDefUuid: entity.nodeDefUuid })(record)
    return includeSelf ? siblingEntities : siblingEntities.filter((sibling) => !Nodes.areEqual(sibling, entity))
  }
)

export const getAttributeSiblings = recordGetter(
  (params: { record: ArenaRecord; node: ArenaRecordNode; nodeDef: NodeDef<NodeDefType, NodeDefProps> }) => {
    const { record, node, nodeDef } = params
    const parentEntity = getParent({ node })(record)
    if (!parentEntity) return []
    const siblingParentEntities = getEntitySiblings({ entity: parentEntity })(record)
    return siblingParentEntities.reduce((siblingsAcc: ArenaRecordNode[], siblingEntity) => {
      siblingsAcc.push(...getChildren({ parentNode: siblingEntity, childDefUuid: nodeDef.uuid })(record))
      return siblingsAcc
    }, [])
  }
)

export const getNodeIndex = recordGetter((params: { record: ArenaRecord; node: ArenaRecordNode }) => {
  const { record, node } = params
  const parentEntity = getParent({ node })(record)
  if (!parentEntity) return 0 // root entity
  const siblings = getChildren({ parentNode: parentEntity, childDefUuid: node.nodeDefUuid })(record)
  return siblings.indexOf(node)
})

export const findEntityByKeyValues = recordGetter(
  (params: {
    survey: Survey
    cycle: string
    record: ArenaRecord
    parentEntity: ArenaRecordNode
    entityDefUuid: string
    keyValuesByDefUuid: Dictionary<any>
  }): ArenaRecordNode | undefined => {
    const { survey, cycle, record, parentEntity, entityDefUuid, keyValuesByDefUuid } = params
    const entityDef = Surveys.getNodeDefByUuid({ survey, uuid: entityDefUuid })
    const siblingEntities = getChildren({ parentNode: parentEntity, childDefUuid: entityDefUuid })(record)
    if (NodeDefs.isSingle(entityDef)) {
      return siblingEntities[0]
    }
    const keyDefs = Surveys.getNodeDefKeys({ survey, cycle, nodeDef: entityDef })

    return siblingEntities.find((siblingEntity) => {
      const siblingEntityKeyValuesByDefUuid = getEntityKeyValuesByDefUuid({ survey, entity: siblingEntity, keyDefs })(
        record
      )
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
)

export const findEntityWithSameKeysInAnotherRecord = recordGetter(
  (params: {
    survey: Survey
    cycle: string
    entityUuid: string
    record: ArenaRecord
    recordOther: ArenaRecord
  }): ArenaRecordNode | undefined => {
    const { survey, cycle, entityUuid, record, recordOther } = params
    const entity = getNodeByUuid({ uuid: entityUuid })(record)
    if (!entity) return undefined

    let otherRecordCurrentParentEntity = getRoot(recordOther)
    if (!otherRecordCurrentParentEntity) return undefined

    const entityAncestorsAndSelf = getAncestorsAndSelf({ node: entity })(record)
    const ancestorDefUuidsAndKeys = entityAncestorsAndSelf.map((ancestor) => ({
      entityDefUuid: ancestor.nodeDefUuid,
      keyValuesByDefUuid: getEntityKeyValuesByDefUuid({ survey, entity: ancestor })(record),
    }))

    const ancestorDefUuidsAndKeysToVisit = [...ancestorDefUuidsAndKeys].reverse()

    for (let index = 1; otherRecordCurrentParentEntity && index < ancestorDefUuidsAndKeysToVisit.length; index++) {
      const { entityDefUuid, keyValuesByDefUuid } = ancestorDefUuidsAndKeysToVisit[index]
      otherRecordCurrentParentEntity = findEntityByKeyValues({
        survey,
        cycle,
        parentEntity: otherRecordCurrentParentEntity,
        entityDefUuid,
        keyValuesByDefUuid,
      })(recordOther)
    }
    return otherRecordCurrentParentEntity
  }
)

export const getDependentNodePointers = recordGetter(
  (params: {
    survey: Survey
    record: ArenaRecord
    node: ArenaRecordNode
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
      const commonAncestorNode = getClosestAncestorNode({ node, nodeDef, dependentDef, dependencyType })(record)
      if (!commonAncestorNode) continue

      const nodeDefDependentParent = Surveys.getNodeDefParent({ survey, nodeDef: dependentDef })
      if (!nodeDefDependentParent) throw new SystemError('record.nodes.dependents.dependencyOnRootFound')

      // 2 find descendant nodes of common parent node with nodeDefUuid = dependentDef uuid
      const dependentContextNodes = getDescendantsOrSelf({
        node: commonAncestorNode,
        nodeDefDescendant: nodeDefDependentParent,
      })(record)

      for (const dependentContextNode of dependentContextNodes) {
        addToNodePointers({
          nodeCtx: dependentContextNode,
          nodeDef: dependentDef,
        })
      }
    }
    if (includeSelf) {
      const parentNode = getParent({ node })(record)
      if (parentNode) {
        addToNodePointers({
          nodeCtx: parentNode,
          nodeDef,
        })
      }
    }

    return nodePointers
  }
)

export const getAncestorCodePath = recordGetter(
  (params: {
    survey: Survey
    record: ArenaRecord
    parentNode: ArenaRecordNode
    nodeDef: NodeDef<NodeDefType.code, NodeDefCodeProps>
  }): string[] => {
    const { record, parentNode, nodeDef, survey } = params

    const getCodeAttributeItemCode = (codeAttribute: ArenaRecordNode | undefined): string => {
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
)

export const getCategoryItemUuid = recordGetter(
  (params: {
    survey: Survey
    nodeDef: NodeDef<NodeDefType.code, NodeDefCodeProps>
    record: ArenaRecord
    parentNode: ArenaRecordNode
    code: string
  }): string | undefined => {
    const { survey, nodeDef, record, parentNode, code } = params
    const categoryUuid = nodeDef.props.categoryUuid

    const codePaths = [...getAncestorCodePath({ survey, parentNode, nodeDef })(record), code]

    const item = Surveys.getCategoryItemByCodePaths({ survey, categoryUuid, codePaths })

    return item?.uuid
  }
)

export const isNodeFilledByUser = positionalRecordGetter({
  getter: ({ record, node }: RecordParams & { node: ArenaRecordNode }): boolean =>
    !!findDescendantOrSelf({ node, predicate: (visitedNode) => Nodes.hasUserInputValue(visitedNode) })(record),
  isPositional: isRecordNode,
  toParams: (node: ArenaRecordNode) => ({ node }),
})

export const isNodeEmpty = positionalRecordGetter({
  getter: ({ record, node }: RecordParams & { node: ArenaRecordNode }): boolean =>
    !isNodeFilledByUser({ node })(record),
  isPositional: isRecordNode,
  toParams: (node: ArenaRecordNode) => ({ node }),
})

export const isEmpty = (record: ArenaRecord): boolean => {
  const rootNode = getRoot(record)
  return rootNode ? isNodeEmpty({ node: rootNode })(record) : true
}

export const getStep = (record: ArenaRecord): string => record.step ?? RECORD_STEP_DEFAULT

export const isInAnalysisStep = (record: ArenaRecord): boolean => getStep(record) === RecordStepAnalysisCode
