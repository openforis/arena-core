import { ArenaSurvey } from '../survey'
import {
  ArenaAnyNodeDef,
  ArenaNodeDef,
  ArenaNodeDefCode,
  ArenaNodeDefCodeProps,
  ArenaNodeDefEntity,
  ArenaNodeDefEntityChildPosition,
  ArenaNodeDefMap,
  NodeDefType,
  NodeDefs,
} from '../../nodeDef'
import { Arrays, Objects, Queue } from '../../utils'
import { SystemError, SystemErrorKeys } from '../../error'
import * as NodeDefsReader from './_nodeDefs/nodeDefsReader'
import * as NodeDefsIndex from './_nodeDefs/nodeDefsIndex'
import { TraverseMethod } from '../../common'
import { getCategoryByUuid } from './surveysGetters'

export const getNodeDefsArray = NodeDefsReader.getNodeDefsArray

export const findNodeDefByUuid = (params: { survey: ArenaSurvey; uuid: string }): ArenaAnyNodeDef | undefined => {
  const { survey, uuid } = params
  return survey.nodeDefs?.[uuid]
}

export const getNodeDefByUuid = (params: { survey: ArenaSurvey; uuid: string }): ArenaAnyNodeDef => {
  const { survey, uuid } = params
  const nodeDef = findNodeDefByUuid({ survey, uuid })
  if (!nodeDef) throw new SystemError(SystemErrorKeys.survey.nodeDefUuidNotFound, { uuid })
  return nodeDef
}

export const findNodeDefByName = (params: { survey: ArenaSurvey; name: string }): ArenaAnyNodeDef | undefined => {
  const { survey, name } = params
  const nodeDefUuidByNameIndex = survey.nodeDefsIndex?.nodeDefUuidByName
  if (nodeDefUuidByNameIndex) {
    const uuid = nodeDefUuidByNameIndex[name]
    return findNodeDefByUuid({ survey, uuid })
  }
  return getNodeDefsArray(survey).find((nodeDef) => nodeDef.props.name === name)
}

export const getNodeDefByName = (params: { survey: ArenaSurvey; name: string }): ArenaAnyNodeDef => {
  const { survey, name } = params
  const nodeDef = findNodeDefByName({ survey, name })
  if (!nodeDef) {
    throw new SystemError(SystemErrorKeys.survey.nodeDefNameNotFound, { name })
  }
  return nodeDef
}

export const getNodeDefsByUuids = (params: { survey: ArenaSurvey; uuids: string[] }) => {
  const { survey, uuids } = params
  return uuids.map((uuid) => getNodeDefByUuid({ survey, uuid }))
}

export const findNodeDefsByUuids = (params: { survey: ArenaSurvey; uuids: string[] }): ArenaAnyNodeDef[] => {
  const { survey, uuids } = params
  return uuids.reduce((acc: ArenaAnyNodeDef[], uuid) => {
    const nodeDef = findNodeDefByUuid({ survey, uuid })
    if (nodeDef) {
      acc.push(nodeDef)
    }
    return acc
  }, [])
}

export const getNodeDefParent = (params: {
  survey: ArenaSurvey
  nodeDef: ArenaAnyNodeDef
}): ArenaNodeDefEntity | undefined => {
  const { survey, nodeDef } = params
  if (!nodeDef.parentUuid) return undefined
  return getNodeDefByUuid({ survey, uuid: nodeDef.parentUuid }) as ArenaNodeDefEntity
}

export const getNodeDefAncestorMultipleEntity = (params: {
  survey: ArenaSurvey
  nodeDef: ArenaAnyNodeDef
}): ArenaNodeDefEntity | undefined => {
  const { survey, nodeDef } = params
  return findAncestorNodeDef({
    survey,
    nodeDef,
    predicate: (entityDef) => NodeDefs.isRoot(entityDef) || NodeDefs.isMultiple(entityDef),
  })
}

export const isNodeDefAncestor = (params: {
  nodeDefAncestor: ArenaAnyNodeDef
  nodeDefDescendant: ArenaAnyNodeDef
}): boolean => {
  const { nodeDefAncestor, nodeDefDescendant } = params

  return Arrays.startsWith(nodeDefDescendant.meta.h, [...nodeDefAncestor.meta.h, nodeDefAncestor.uuid])
}

export const getNodeDefRoot = (params: { survey: ArenaSurvey }): ArenaNodeDefEntity => {
  const { survey } = params
  if (!survey.nodeDefs) throw new SystemError(SystemErrorKeys.survey.emptyNodeDefs)

  const rootDefUuidInIndex = survey.nodeDefsIndex?.rootDefUuid

  const rootDef = rootDefUuidInIndex
    ? getNodeDefByUuid({ survey, uuid: rootDefUuidInIndex })
    : getNodeDefsArray(survey).find((nodeDef) => !nodeDef.parentUuid)

  if (!rootDef) throw new SystemError(SystemErrorKeys.survey.rootDefNotFound)

  return rootDef as ArenaNodeDefEntity
}

export const getNodeDefSource = (params: {
  survey: ArenaSurvey
  nodeDef: ArenaAnyNodeDef
}): ArenaAnyNodeDef | undefined => {
  const { survey, nodeDef } = params
  return nodeDef.virtual ? getNodeDefParent({ survey, nodeDef }) : undefined
}

export const getNodeDefChildren = (params: {
  survey: ArenaSurvey
  nodeDef: ArenaAnyNodeDef
  includeAnalysis?: boolean
  includeLayoutElements?: boolean
}): ArenaAnyNodeDef[] => {
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

export const getQualifierDefs = (params: { survey: ArenaSurvey }): ArenaAnyNodeDef[] => {
  const { survey } = params
  const qualifierPresence = survey.nodeDefsIndex?.qualifierPresenceByUuid
  if (qualifierPresence) {
    const qualifierUuids = Object.keys(qualifierPresence)
    return getNodeDefsByUuids({ survey, uuids: qualifierUuids })
  } else {
    return getNodeDefsArray(survey).filter((nodeDef) => NodeDefs.isQualifier(nodeDef))
  }
}

const getIndexInChain = (params: { survey: ArenaSurvey; nodeDef: ArenaNodeDef<any> }): number => {
  const { survey, nodeDef } = params
  const areaBasedEstimatedOf = NodeDefs.getAreaBasedEstimatedOf(nodeDef)
  const areaBasedEstimatedOfNodeDef = areaBasedEstimatedOf
    ? getNodeDefByUuid({ survey, uuid: areaBasedEstimatedOf })
    : null
  const nodeDefToConsider = areaBasedEstimatedOfNodeDef ?? nodeDef
  return nodeDefToConsider?.propsAdvanced?.index ?? 0
}

const getNodeDefChildrenUuidsSortedByLayout = (params: {
  nodeDef: ArenaAnyNodeDef
  cycle: string
  children: ArenaNodeDef<any>[]
}): string[] => {
  const { nodeDef, cycle, children } = params

  const entityDef = nodeDef as ArenaNodeDefEntity

  const childrenEntitiesInOwnPageSortedUuids = NodeDefs.getChildrenEntitiesInOwnPageUuids(cycle)(entityDef) ?? []
  const layoutChildren = NodeDefs.getLayoutChildren(cycle)(entityDef) ?? []
  const childrenByUuids = children.reduce((acc: ArenaNodeDefMap, child) => {
    acc[child.uuid] = child
    return acc
  }, {})
  const childrenUuids = Object.keys(childrenByUuids)

  if (layoutChildren.length === 0 && childrenEntitiesInOwnPageSortedUuids.length === 0) {
    return childrenUuids
  }
  const sortedChildrenDefsInSamePageUuids = NodeDefs.isLayoutRenderTypeTable(cycle)(entityDef)
    ? (layoutChildren as string[])
    : [...(layoutChildren as ArenaNodeDefEntityChildPosition[])]
        .sort(
          (gridItem1: ArenaNodeDefEntityChildPosition, gridItem2: ArenaNodeDefEntityChildPosition) =>
            gridItem1.y - gridItem2.y || gridItem1.x - gridItem2.x
        )
        .map((gridItem) => gridItem.i)
        .filter((nodeDefUuid) => !!childrenByUuids[nodeDefUuid])

  const missingChildrenUuidsInLayout = childrenUuids.filter((childUuid) => {
    const childDef = childrenByUuids[childUuid]
    return (
      !sortedChildrenDefsInSamePageUuids.includes(childUuid) &&
      !childrenEntitiesInOwnPageSortedUuids.includes(childUuid) &&
      NodeDefs.isInCycle(cycle)(childDef)
    )
  })

  return (
    sortedChildrenDefsInSamePageUuids
      // add child uuids missing in layout at the end
      .concat(missingChildrenUuidsInLayout)
      // add child entities in own page at the very end
      .concat(childrenEntitiesInOwnPageSortedUuids)
  )
}

const _booleanToNumber = (value: boolean | undefined): number => (value ? 1 : 0)
const _compareBooleans = (value1: boolean | undefined, value2: boolean | undefined): number =>
  _booleanToNumber(value1) - _booleanToNumber(value2)

export const getNodeDefChildrenSorted = (params: {
  survey: ArenaSurvey
  nodeDef: ArenaAnyNodeDef
  cycle: string
  includeAnalysis?: boolean
  includeLayoutElements?: boolean
}): ArenaAnyNodeDef[] => {
  const { survey, nodeDef, cycle, includeAnalysis, includeLayoutElements } = params

  const children = getNodeDefChildren({ survey, nodeDef, includeAnalysis, includeLayoutElements }).filter(
    NodeDefs.isInCycle(cycle)
  )

  const childrenUuidsSortedByLayout = getNodeDefChildrenUuidsSortedByLayout({ nodeDef, cycle, children })
  // position lookup in the comparator without scanning the array (-1 for children not in the layout, as indexOf)
  const layoutIndexByUuid = new Map(childrenUuidsSortedByLayout.map((uuid, index) => [uuid, index]))
  const getLayoutIndex = (child: ArenaNodeDef<any>): number => layoutIndexByUuid.get(child.uuid) ?? -1

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
    return getLayoutIndex(child1) - getLayoutIndex(child2)
  })
}

export const visitAncestorsAndSelfNodeDef = (params: {
  survey: ArenaSurvey
  nodeDef: ArenaNodeDef<any>
  visitor: (nodeDef: ArenaNodeDef<any>) => void
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
  survey: ArenaSurvey
  nodeDef: ArenaNodeDef<any>
  predicate: (entityDef: ArenaNodeDefEntity) => boolean
}): ArenaNodeDefEntity | undefined => {
  const { survey, nodeDef, predicate } = params
  let result: ArenaNodeDefEntity | undefined = undefined
  visitAncestorsAndSelfNodeDef({
    survey,
    nodeDef,
    // ancestors only: the node def itself is never an ancestor (e.g. a multiple attribute)
    includeSelf: false,
    visitor: (entityDef) => {
      if (predicate(entityDef)) {
        result = entityDef
      }
    },
    stopIfFn: () => !!result,
  })
  return result
}

type NodeDefTraverseParams = {
  nodeDef: ArenaNodeDef<any>
  visitor: (nodeDef: ArenaNodeDef<any>) => void
  shouldTraverse: (nodeDef: ArenaNodeDef<any>) => boolean
  getChildren: (nodeDef: ArenaNodeDef<any>) => ArenaNodeDef<any>[]
}

const traverseBreadthFirst = ({ nodeDef, visitor, shouldTraverse, getChildren }: NodeDefTraverseParams) => {
  const queue = new Queue<ArenaAnyNodeDef>()

  queue.enqueue(nodeDef)

  while (!queue.isEmpty()) {
    const visitedNodeDef = queue.dequeue()!

    visitor(visitedNodeDef)

    if (shouldTraverse(visitedNodeDef)) {
      queue.enqueueItems(getChildren(visitedNodeDef))
    }
  }
}

const traverseDepthFirst = ({ nodeDef, visitor, shouldTraverse, getChildren }: NodeDefTraverseParams) => {
  const stack: ArenaNodeDef<any>[] = []

  stack.push(nodeDef)

  while (stack.length > 0) {
    const visitedNodeDef = stack.pop()!

    visitor(visitedNodeDef)

    if (shouldTraverse(visitedNodeDef)) {
      const children = getChildren(visitedNodeDef)
      // add children to stack in reverse order
      for (let index = children.length - 1; index >= 0; index--) {
        stack.push(children[index])
      }
    }
  }
}

export const visitDescendantsAndSelfNodeDef = (params: {
  survey: ArenaSurvey
  cycle?: string
  nodeDef: ArenaNodeDef<any>
  visitor: (nodeDef: ArenaNodeDef<any>) => void
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

  const getNodeDefChildrenInternal = (visitedNodeDef: ArenaNodeDef<any>) =>
    Objects.isEmpty(cycle)
      ? getNodeDefChildren({ survey, nodeDef: visitedNodeDef, includeAnalysis })
      : getNodeDefChildrenSorted({ survey, nodeDef: visitedNodeDef, cycle: cycle!, includeAnalysis })

  const shouldTraverse = (visitedNodeDef: ArenaNodeDef<any>): boolean =>
    visitedNodeDef.type === NodeDefType.entity &&
    (visitedNodeDef === nodeDef ||
      NodeDefs.isRoot(visitedNodeDef) ||
      !traverseOnlySingleEntities ||
      NodeDefs.isSingle(visitedNodeDef))

  const traverseParams = { nodeDef, visitor, shouldTraverse, getChildren: getNodeDefChildrenInternal }
  if (traverseMethod === TraverseMethod.bfs) {
    traverseBreadthFirst(traverseParams)
  } else {
    traverseDepthFirst(traverseParams)
  }
}

export const visitNodeDefs = (params: {
  survey: ArenaSurvey
  visitor: (nodeDef: ArenaNodeDef<any>) => void
  includeAnalysis?: boolean
  traverseMethod?: TraverseMethod
}) => {
  const { survey, visitor, traverseMethod = TraverseMethod.bfs, includeAnalysis = false } = params
  const rootDef = getNodeDefRoot({ survey })
  return visitDescendantsAndSelfNodeDef({ survey, nodeDef: rootDef, visitor, traverseMethod, includeAnalysis })
}

// Node Def Code
export const getNodeDefParentCode = (params: {
  survey: ArenaSurvey
  nodeDef: ArenaNodeDefCode
}): ArenaNodeDefCode | undefined => {
  const { survey, nodeDef } = params
  const parentCodeDefUuid = nodeDef.props.parentCodeDefUuid
  if (!parentCodeDefUuid) return undefined
  const parentCodeDef = getNodeDefByUuid({ survey, uuid: parentCodeDefUuid })
  return parentCodeDef as ArenaNodeDefCode
}

export const getNodeDefAncestorCodes = (params: {
  survey: ArenaSurvey
  nodeDef: ArenaNodeDefCode
}): ArenaNodeDefCode[] => {
  const { survey, nodeDef } = params
  const ancestors = []
  let currentParentCode = getNodeDefParentCode({ survey, nodeDef })
  while (currentParentCode) {
    ancestors.unshift(currentParentCode)
    currentParentCode = getNodeDefParentCode({ survey, nodeDef: currentParentCode })
  }
  return ancestors
}

export const isNodeDefParentCode = (params: { survey: ArenaSurvey; nodeDef: ArenaAnyNodeDef }): boolean => {
  const { survey, nodeDef } = params
  const nodeDefsArray = getNodeDefsArray(survey)
  return nodeDefsArray.some(
    (def) => nodeDef.uuid === (def as ArenaNodeDef<NodeDefType.code, ArenaNodeDefCodeProps>).props?.parentCodeDefUuid
  )
}

export const getNodeDefCategoryLevelIndex = (params: { survey: ArenaSurvey; nodeDef: ArenaNodeDefCode }): number => {
  const { survey, nodeDef } = params
  const parentCodeNodeDef = getNodeDefParentCode({ survey, nodeDef })
  return parentCodeNodeDef ? 1 + getNodeDefCategoryLevelIndex({ survey, nodeDef: parentCodeNodeDef }) : 0
}

export const getDependentCodeAttributeDefs = (params: {
  survey: ArenaSurvey
  nodeDef: ArenaNodeDefCode
}): ArenaNodeDefCode[] => {
  const { survey, nodeDef } = params

  const categoryUuid = NodeDefs.getCategoryUuid(nodeDef)
  if (!categoryUuid) return []

  const category = getCategoryByUuid({ survey, categoryUuid })
  const levelsCount = Object.keys(category?.levels ?? {}).length
  if (levelsCount <= 1) return []

  const nodeDefsArray = getNodeDefsArray(survey)
  return nodeDefsArray.filter(
    (def) => def.type === NodeDefType.code && NodeDefs.getParentCodeDefUuid(def as ArenaNodeDefCode) === nodeDef.uuid
  ) as ArenaNodeDefCode[]
}

export const getDependentEnumeratedEntityDefs = (params: {
  survey: ArenaSurvey
  nodeDef: ArenaNodeDefCode
}): ArenaNodeDefEntity[] => {
  const { survey, nodeDef } = params
  const result: ArenaNodeDefEntity[] = []
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
  survey: ArenaSurvey
  nodeDef: ArenaAnyNodeDef
  cycle?: string
}): ArenaAnyNodeDef[] => {
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

export const getRootKeys = (params: { survey: ArenaSurvey; cycle?: string }) => {
  const { survey, cycle } = params
  const rootDef = getNodeDefRoot({ survey })
  return getNodeDefKeys({ survey, nodeDef: rootDef, cycle })
}

export const getNodeDefEnumerator = (params: {
  survey: ArenaSurvey
  entityDef: ArenaNodeDefEntity
}): ArenaNodeDefCode | undefined => {
  const { survey, entityDef } = params
  if (!entityDef.props.enumerate) return undefined

  const children = getNodeDefChildren({ survey, nodeDef: entityDef })
  const codeAttributeKeys = children.filter((child) => child.type === NodeDefType.code && child.props.key)
  if (codeAttributeKeys.length === 1) {
    return codeAttributeKeys[0] as ArenaNodeDefCode
  }
  return undefined
}

export const isNodeDefEnumerator = (params: { survey: ArenaSurvey; nodeDef: ArenaAnyNodeDef }): boolean => {
  const { survey, nodeDef } = params
  if (nodeDef.type !== NodeDefType.code) return false
  const entityDef = getNodeDefParent({ survey, nodeDef })
  if (!entityDef) return false
  const enumerator = getNodeDefEnumerator({ survey, entityDef })
  return enumerator?.uuid === nodeDef.uuid
}

export const getDescendantsInSingleEntities = (params: {
  survey: ArenaSurvey
  cycle?: string
  nodeDef: ArenaAnyNodeDef
  predicate?: (visitedNodeDef: ArenaAnyNodeDef) => boolean
  includeAnalysis?: boolean
}): ArenaAnyNodeDef[] => {
  const { survey, cycle, nodeDef, predicate, includeAnalysis } = params
  const result: ArenaNodeDef<any>[] = []
  visitDescendantsAndSelfNodeDef({
    survey,
    cycle,
    nodeDef,
    visitor: (visitedNodeDef) => {
      if (!predicate || predicate(visitedNodeDef)) {
        result.push(visitedNodeDef)
      }
    },
    includeAnalysis,
    traverseOnlySingleEntities: true,
  })
  return result
}

export const getNodeDefsIncludedInMultipleEntitySummary = (params: {
  survey: ArenaSurvey
  cycle: string
  nodeDef: ArenaAnyNodeDef
}): ArenaAnyNodeDef[] => {
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
