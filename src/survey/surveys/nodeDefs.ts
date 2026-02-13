import { Survey } from '../survey'
import {
  NodeDef,
  NodeDefCode,
  NodeDefCodeProps,
  NodeDefEntity,
  NodeDefEntityChildPosition,
  NodeDefMap,
  NodeDefProps,
  NodeDefType,
  NodeDefs,
} from '../../nodeDef'
import { Arrays, Objects, Queue } from '../../utils'
import { SystemError } from '../../error'
import * as NodeDefsReader from './_nodeDefs/nodeDefsReader'
import * as NodeDefsIndex from './_nodeDefs/nodeDefsIndex'
import { TraverseMethod } from '../../common'
import { getCategoryByUuid } from './surveysGetters'

export const getNodeDefsArray = NodeDefsReader.getNodeDefsArray

export const findNodeDefByUuid = (params: {
  survey: Survey
  uuid: string
}): NodeDef<NodeDefType, NodeDefProps> | undefined => {
  const { survey, uuid } = params
  return survey.nodeDefs?.[uuid]
}

export const getNodeDefByUuid = (params: { survey: Survey; uuid: string }): NodeDef<NodeDefType, NodeDefProps> => {
  const { survey, uuid } = params
  const nodeDef = findNodeDefByUuid({ survey, uuid })
  if (!nodeDef) throw new SystemError('survey.nodeDefUuidNotFound', { uuid })
  return nodeDef
}

export const findNodeDefByName = (params: {
  survey: Survey
  name: string
}): NodeDef<NodeDefType, NodeDefProps> | undefined => {
  const { survey, name } = params
  const nodeDefUuidByNameIndex = survey.nodeDefsIndex?.nodeDefUuidByName
  if (nodeDefUuidByNameIndex) {
    const uuid = nodeDefUuidByNameIndex[name]
    return findNodeDefByUuid({ survey, uuid })
  }
  return getNodeDefsArray(survey).find((nodeDef) => nodeDef.props.name === name)
}

export const getNodeDefByName = (params: { survey: Survey; name: string }): NodeDef<NodeDefType, NodeDefProps> => {
  const { survey, name } = params
  const nodeDef = findNodeDefByName({ survey, name })
  if (!nodeDef) {
    throw new SystemError('survey.nodeDefNameNotFound', { name })
  }
  return nodeDef
}

export const getNodeDefsByUuids = (params: { survey: Survey; uuids: string[] }) => {
  const { survey, uuids } = params
  return uuids.map((uuid) => getNodeDefByUuid({ survey, uuid }))
}

export const findNodeDefsByUuids = (params: {
  survey: Survey
  uuids: string[]
}): NodeDef<NodeDefType, NodeDefProps>[] => {
  const { survey, uuids } = params
  return uuids.reduce((acc: NodeDef<NodeDefType, NodeDefProps>[], uuid) => {
    const nodeDef = findNodeDefByUuid({ survey, uuid })
    if (nodeDef) {
      acc.push(nodeDef)
    }
    return acc
  }, [])
}

export const getNodeDefParent = (params: {
  survey: Survey
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
}): NodeDefEntity | undefined => {
  const { survey, nodeDef } = params
  if (!nodeDef.parentUuid) return undefined
  return getNodeDefByUuid({ survey, uuid: nodeDef.parentUuid }) as NodeDefEntity
}

export const getNodeDefAncestorMultipleEntity = (params: {
  survey: Survey
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
}): NodeDefEntity | undefined => {
  const { survey, nodeDef } = params
  return findAncestorNodeDef({
    survey,
    nodeDef,
    predicate: (entityDef) => NodeDefs.isRoot(entityDef) || NodeDefs.isMultiple(entityDef),
  })
}

export const isNodeDefAncestor = (params: {
  nodeDefAncestor: NodeDef<NodeDefType, NodeDefProps>
  nodeDefDescendant: NodeDef<NodeDefType, NodeDefProps>
}): boolean => {
  const { nodeDefAncestor, nodeDefDescendant } = params

  return Arrays.startsWith(nodeDefDescendant.meta.h, [...nodeDefAncestor.meta.h, nodeDefAncestor.uuid])
}

export const getNodeDefRoot = (params: { survey: Survey }): NodeDefEntity => {
  const { survey } = params
  if (!survey.nodeDefs) throw new SystemError('survey.emptyNodeDefs')

  const rootDefUuidInIndex = survey.nodeDefsIndex?.rootDefUuid

  const rootDef = rootDefUuidInIndex
    ? getNodeDefByUuid({ survey, uuid: rootDefUuidInIndex })
    : getNodeDefsArray(survey).find((nodeDef) => !nodeDef.parentUuid)

  if (!rootDef) throw new SystemError('survey.rootDefNotFound')

  return rootDef as NodeDefEntity
}

export const getNodeDefSource = (params: {
  survey: Survey
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
}): NodeDef<NodeDefType, NodeDefProps> | undefined => {
  const { survey, nodeDef } = params
  return nodeDef.virtual ? getNodeDefParent({ survey, nodeDef }) : undefined
}

export const getNodeDefChildren = (params: {
  survey: Survey
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
  includeAnalysis?: boolean
  includeLayoutElements?: boolean
}): NodeDef<NodeDefType, NodeDefProps>[] => {
  const { survey, nodeDef, includeAnalysis = false, includeLayoutElements = false } = params

  if (!survey.nodeDefs) return []

  let childDefs = []
  // try to get children using index
  if (survey.nodeDefsIndex) {
    const childrenUuids = Object.keys(survey.nodeDefsIndex.childDefUuidPresenceByParentUuid?.[nodeDef.uuid] ?? {})
    childDefs = getNodeDefsByUuids({ survey, uuids: childrenUuids })
  } else {
    // calculate children
    childDefs = NodeDefsReader.calculateNodeDefChildren(nodeDef)(survey)
  }
  if (includeAnalysis && includeLayoutElements) {
    return childDefs
  }
  return childDefs.filter((childDef) => {
    if (!includeAnalysis && childDef.analysis) return false
    if (!includeLayoutElements && NodeDefs.isLayoutElement(childDef)) return false
    return true
  })
}

const getIndexInChain = (params: { survey: Survey; nodeDef: NodeDef<any> }): number => {
  const { survey, nodeDef } = params
  const areaBasedEstimatedOf = NodeDefs.getAreaBasedEstimatedOf(nodeDef)
  const areaBasedEstimatedOfNodeDef = areaBasedEstimatedOf
    ? getNodeDefByUuid({ survey, uuid: areaBasedEstimatedOf })
    : null
  const nodeDefToConsider = areaBasedEstimatedOfNodeDef ? areaBasedEstimatedOfNodeDef : nodeDef
  return nodeDefToConsider?.propsAdvanced?.index ?? 0
}

const getNodeDefChildrenUuidsSortedByLayout = (params: {
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
  cycle: string
  children: NodeDef<any>[]
}): string[] => {
  const { nodeDef, cycle, children } = params

  const entityDef = nodeDef as NodeDefEntity

  const childrenEntitiesInOwnPageUudis = NodeDefs.getChildrenEntitiesInOwnPageUudis(cycle)(entityDef) ?? []
  const layoutChildren = NodeDefs.getLayoutChildren(cycle)(entityDef) ?? []
  const childrenByUuids = children.reduce((acc: NodeDefMap, child) => {
    acc[child.uuid] = child
    return acc
  }, {})
  const childrenUuids = Object.keys(childrenByUuids)

  if (layoutChildren.length === 0 && childrenEntitiesInOwnPageUudis.length === 0) {
    return childrenUuids
  }
  const sortedChildrenDefsInSamePageUuids = NodeDefs.isLayoutRenderTypeTable(cycle)(entityDef)
    ? (layoutChildren as string[])
    : [...(layoutChildren as NodeDefEntityChildPosition[])]
        .sort(
          (gridItem1: NodeDefEntityChildPosition, gridItem2: NodeDefEntityChildPosition) =>
            gridItem1.y - gridItem2.y || gridItem1.x - gridItem2.x
        )
        .map((gridItem) => gridItem.i)
        .filter((nodeDefUuid) => !!childrenByUuids[nodeDefUuid])

  const missingChildrenUuidsInLayout = childrenUuids.filter((childUuid) => {
    const childDef = childrenByUuids[childUuid]
    return (
      !sortedChildrenDefsInSamePageUuids.includes(childUuid) &&
      !childrenEntitiesInOwnPageUudis.includes(childUuid) &&
      NodeDefs.isInCycle(cycle)(childDef)
    )
  })

  return (
    sortedChildrenDefsInSamePageUuids
      // add child uuids missing in layout at the end
      .concat(missingChildrenUuidsInLayout)
      // add child entities in own page at the very end
      .concat(childrenEntitiesInOwnPageUudis)
  )
}

const _booleanToNumber = (value: boolean | undefined): number => (value ? 1 : 0)
const _compareBooleans = (value1: boolean | undefined, value2: boolean | undefined): number =>
  _booleanToNumber(value1) - _booleanToNumber(value2)

export const getNodeDefChildrenSorted = (params: {
  survey: Survey
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
  cycle: string
  includeAnalysis?: boolean
  includeLayoutElements?: boolean
}): NodeDef<NodeDefType, NodeDefProps>[] => {
  const { survey, nodeDef, cycle, includeAnalysis, includeLayoutElements } = params

  const children = getNodeDefChildren({ survey, nodeDef, includeAnalysis, includeLayoutElements }).filter(
    NodeDefs.isInCycle(cycle)
  )

  const childrenUuidsSortedByLayout = getNodeDefChildrenUuidsSortedByLayout({ nodeDef, cycle, children })

  return children.sort((child1, child2) => {
    if (includeAnalysis && (child1.analysis || child2.analysis)) {
      // analysis attribute at the end
      const analysisComparison = _compareBooleans(child1.analysis, child2.analysis)
      if (analysisComparison !== 0) return analysisComparison

      // sort by chain index
      const indexInChainComparison =
        getIndexInChain({ survey, nodeDef: child1 }) - getIndexInChain({ survey, nodeDef: child2 })
      if (indexInChainComparison !== 0) return indexInChainComparison

      // one node def is the area base estimated of the other
      const areaBasedEstimatedOfComparison = _compareBooleans(
        !!NodeDefs.getAreaBasedEstimatedOf(child1),
        !!NodeDefs.getAreaBasedEstimatedOf(child2)
      )
      if (areaBasedEstimatedOfComparison !== 0) return areaBasedEstimatedOfComparison

      return (child1.id ?? 0) - (child2.id ?? 0)
    }
    // keep sorting as defined in layout props
    return childrenUuidsSortedByLayout.indexOf(child1.uuid) - childrenUuidsSortedByLayout.indexOf(child2.uuid)
  })
}

export const visitAncestorsAndSelfNodeDef = (params: {
  survey: Survey
  nodeDef: NodeDef<any>
  visitor: (nodeDef: NodeDef<any>) => void
  stopIfFn?: () => boolean
  includeSelf?: boolean
}): void => {
  const { survey, nodeDef, visitor, stopIfFn, includeSelf = true } = params
  if (includeSelf) {
    visitor(nodeDef)
  }
  let currentParent = getNodeDefParent({ survey, nodeDef })
  while (currentParent) {
    visitor(currentParent)
    if (stopIfFn?.()) {
      break
    }
    currentParent = getNodeDefParent({ survey, nodeDef: currentParent })
  }
}

export const findAncestorNodeDef = (params: {
  survey: Survey
  nodeDef: NodeDef<any>
  predicate: (entityDef: NodeDefEntity) => boolean
}): NodeDefEntity | undefined => {
  const { survey, nodeDef, predicate } = params
  let result: NodeDefEntity | undefined = undefined
  visitAncestorsAndSelfNodeDef({
    survey,
    nodeDef,
    visitor: (entityDef) => {
      if (predicate(entityDef)) {
        result = entityDef
      }
    },
    stopIfFn: () => !!result,
  })
  return result
}

export const visitDescendantsAndSelfNodeDef = (params: {
  survey: Survey
  cycle?: string
  nodeDef: NodeDef<any>
  visitor: (nodeDef: NodeDef<any>) => void
  includeAnalysis?: boolean
  traverseMethod?: TraverseMethod
  traverseOnlySingleEntities?: boolean
}) => {
  const {
    survey,
    cycle,
    nodeDef,
    visitor,
    includeAnalysis = false,
    traverseMethod = TraverseMethod.bfs,
    traverseOnlySingleEntities = false,
  } = params

  const getNodeDefChildrenInternal = (visitedNodeDef: NodeDef<any>) =>
    Objects.isEmpty(cycle)
      ? getNodeDefChildren({ survey, nodeDef: visitedNodeDef, includeAnalysis })
      : getNodeDefChildrenSorted({ survey, nodeDef: visitedNodeDef, cycle: cycle!, includeAnalysis })

  const shouldTraverse = (visitedNodeDef: NodeDef<any>): boolean =>
    visitedNodeDef.type === NodeDefType.entity &&
    (visitedNodeDef === nodeDef ||
      NodeDefs.isRoot(visitedNodeDef) ||
      !traverseOnlySingleEntities ||
      NodeDefs.isSingle(visitedNodeDef))

  if (traverseMethod === TraverseMethod.bfs) {
    const queue = new Queue()

    queue.enqueue(nodeDef)

    while (!queue.isEmpty()) {
      const visitedNodeDef = queue.dequeue()

      visitor(visitedNodeDef)

      if (shouldTraverse(visitedNodeDef)) {
        const childrenDefs = getNodeDefChildrenInternal(visitedNodeDef)
        queue.enqueueItems(childrenDefs)
      }
    }
  } else {
    const stack = []

    stack.push(nodeDef)

    while (stack.length > 0) {
      const visitedNodeDef = stack.pop()!

      visitor(visitedNodeDef)

      if (shouldTraverse(visitedNodeDef)) {
        const children = getNodeDefChildrenInternal(visitedNodeDef)
        // add children to stack in reverse order
        for (let index = children.length - 1; index >= 0; index--) {
          const child = children[index]
          stack.push(child)
        }
      }
    }
  }
}

export const visitNodeDefs = (params: {
  survey: Survey
  visitor: (nodeDef: NodeDef<any>) => void
  includeAnalysis?: boolean
  traverseMethod?: TraverseMethod
}) => {
  const { survey, visitor, traverseMethod = TraverseMethod.bfs, includeAnalysis = false } = params
  const rootDef = getNodeDefRoot({ survey })
  return visitDescendantsAndSelfNodeDef({ survey, nodeDef: rootDef, visitor, traverseMethod, includeAnalysis })
}

// Node Def Code
export const getNodeDefParentCode = (params: { survey: Survey; nodeDef: NodeDefCode }): NodeDefCode | undefined => {
  const { survey, nodeDef } = params
  const parentCodeDefUuid = nodeDef.props.parentCodeDefUuid
  if (!parentCodeDefUuid) return undefined
  const parentCodeDef = getNodeDefByUuid({ survey, uuid: parentCodeDefUuid })
  return parentCodeDef as NodeDefCode
}

export const getNodeDefAncestorCodes = (params: { survey: Survey; nodeDef: NodeDefCode }): NodeDefCode[] => {
  const { survey, nodeDef } = params
  const ancestors = []
  let currentParentCode = getNodeDefParentCode({ survey, nodeDef })
  while (currentParentCode) {
    ancestors.unshift(currentParentCode)
    currentParentCode = getNodeDefParentCode({ survey, nodeDef: currentParentCode })
  }
  return ancestors
}

export const isNodeDefParentCode = (params: {
  survey: Survey
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
}): boolean => {
  const { survey, nodeDef } = params
  const nodeDefsArray = getNodeDefsArray(survey)
  return nodeDefsArray.some((def) => {
    try {
      return nodeDef.uuid === (def as NodeDef<NodeDefType.code, NodeDefCodeProps>).props.parentCodeDefUuid
    } catch (error) {
      // ignore it: def is not a code attribute definition
      return
    }
  })
}

export const getNodeDefCategoryLevelIndex = (params: { survey: Survey; nodeDef: NodeDefCode }): number => {
  const { survey, nodeDef } = params
  const parentCodeNodeDef = getNodeDefParentCode({ survey, nodeDef })
  return parentCodeNodeDef ? 1 + getNodeDefCategoryLevelIndex({ survey, nodeDef: parentCodeNodeDef }) : 0
}

export const getDependentCodeAttributeDefs = (params: { survey: Survey; nodeDef: NodeDefCode }): NodeDefCode[] => {
  const { survey, nodeDef } = params

  const categoryUuid = NodeDefs.getCategoryUuid(nodeDef)
  if (!categoryUuid) return []

  const category = getCategoryByUuid({ survey, categoryUuid })
  const levelsCount = Object.keys(category?.levels ?? {}).length
  if (levelsCount <= 1) return []

  const nodeDefsArray = getNodeDefsArray(survey)
  return nodeDefsArray.filter(
    (def) => def.type === NodeDefType.code && NodeDefs.getParentCodeDefUuid(def as NodeDefCode) === nodeDef.uuid
  ) as NodeDefCode[]
}

export const getDependentEnumeratedEntityDefs = (params: { survey: Survey; nodeDef: NodeDefCode }): NodeDefEntity[] => {
  const { survey, nodeDef } = params
  const result: NodeDefEntity[] = []
  const dependentCodeAttributeDefs = getDependentCodeAttributeDefs({ survey, nodeDef })
  for (const dependentCodeDef of dependentCodeAttributeDefs) {
    if (NodeDefs.isKey(dependentCodeDef)) {
      const entityDef = getNodeDefAncestorMultipleEntity({ survey, nodeDef: dependentCodeDef })
      if (entityDef && NodeDefs.isEnumerate(entityDef)) {
        result.push(entityDef)
      }
    }
  }
  return result
}

export const getNodeDefKeys = (params: {
  survey: Survey
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
  cycle?: string
}): NodeDef<NodeDefType, NodeDefProps>[] => {
  const { survey, cycle, nodeDef } = params

  return getDescendantsInSingleEntities({
    survey,
    cycle,
    nodeDef,
    predicate: (visitedNodeDef) =>
      NodeDefs.isKey(visitedNodeDef) &&
      !visitedNodeDef.deleted &&
      (Objects.isEmpty(cycle) || NodeDefs.isInCycle(cycle!)(visitedNodeDef)),
  })
}

export const getRootKeys = (params: { survey: Survey; cycle?: string }) => {
  const { survey, cycle } = params
  const rootDef = getNodeDefRoot({ survey })
  return getNodeDefKeys({ survey, nodeDef: rootDef, cycle })
}

export const getNodeDefEnumerator = (params: { survey: Survey; entityDef: NodeDefEntity }): NodeDefCode | undefined => {
  const { survey, entityDef } = params
  if (!entityDef.props.enumerate) return undefined

  const children = getNodeDefChildren({ survey, nodeDef: entityDef })
  const codeAttributeKeys = children.filter((child) => child.type === NodeDefType.code && child.props.key)
  if (codeAttributeKeys.length === 1) {
    return codeAttributeKeys[0] as NodeDefCode
  }
  return undefined
}

export const isNodeDefEnumerator = (params: { survey: Survey; nodeDef: NodeDef<NodeDefType> }): boolean => {
  const { survey, nodeDef } = params
  const entityDef = getNodeDefParent({ survey, nodeDef })
  if (!entityDef) return false
  const enumerator = getNodeDefEnumerator({ survey, entityDef })
  return enumerator?.uuid === nodeDef.uuid
}

export const getDescendantsInSingleEntities = (params: {
  survey: Survey
  cycle?: string
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
  predicate?: (visitedNodeDef: NodeDef<NodeDefType, NodeDefProps>) => boolean
}): NodeDef<NodeDefType, NodeDefProps>[] => {
  const { survey, cycle, nodeDef, predicate } = params
  const result: NodeDef<any>[] = []
  visitDescendantsAndSelfNodeDef({
    survey,
    cycle,
    nodeDef,
    visitor: (visitedNodeDef) => {
      if (!predicate || predicate(visitedNodeDef)) {
        result.push(visitedNodeDef)
      }
    },
    traverseOnlySingleEntities: true,
  })
  return result
}

export const getNodeDefsIncludedInMultipleEntitySummary = (params: {
  survey: Survey
  cycle: string
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
}): NodeDef<NodeDefType, NodeDefProps>[] => {
  const { survey, cycle, nodeDef } = params
  return getDescendantsInSingleEntities({
    survey,
    cycle,
    nodeDef,
    predicate: (visitedNodeDef) => NodeDefs.isIncludedInMultipleEntitySummary(cycle)(visitedNodeDef),
  })
}

const { buildAndAssocNodeDefsIndex, addNodeDefToIndex, updateNodeDefUuidByNameIndex, deleteNodeDefIndex } =
  NodeDefsIndex
export { buildAndAssocNodeDefsIndex, addNodeDefToIndex, updateNodeDefUuidByNameIndex, deleteNodeDefIndex }
