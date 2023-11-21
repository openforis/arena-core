import { Survey } from '../survey'
import {
  NodeDef,
  NodeDefCode,
  NodeDefCodeProps,
  NodeDefEntity,
  NodeDefEntityChildPosition,
  NodeDefProps,
  NodeDefType,
  NodeDefs,
} from '../../nodeDef'
import { Arrays, Queue } from '../../utils'
import { SystemError } from '../../error'
import * as NodeDefsReader from './_nodeDefs/nodeDefsReader'
import * as NodeDefsIndex from './_nodeDefs/nodeDefsIndex'
import { TraverseMethod } from '../../common'

export const getNodeDefsArray = NodeDefsReader.getNodeDefsArray

export const getNodeDefByName = (params: { survey: Survey; name: string }): NodeDef<NodeDefType, NodeDefProps> => {
  const { survey, name } = params
  const nodeDef = getNodeDefsArray(survey).find((nodeDef) => nodeDef.props.name === name)
  if (!nodeDef) throw new SystemError('survey.nodeDefNameNotFound', { name })
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

export const getNodeDefByUuid = (params: { survey: Survey; uuid: string }): NodeDef<NodeDefType, NodeDefProps> => {
  const { survey, uuid } = params
  const nodeDef = survey.nodeDefs?.[uuid]
  if (!nodeDef) throw new SystemError('survey.nodeDefUuidNotFound', { uuid })
  return nodeDef
}

export const findNodeDefByUuid = (params: {
  survey: Survey
  uuid: string
}): NodeDef<NodeDefType, NodeDefProps> | undefined => {
  try {
    return getNodeDefByUuid(params)
  } catch (error) {
    return undefined
  }
}

export const getNodeDefParent = (params: {
  survey: Survey
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
}): NodeDefEntity | undefined => {
  const { survey, nodeDef } = params
  if (!nodeDef.parentUuid) return undefined
  return getNodeDefByUuid({ survey, uuid: nodeDef.parentUuid }) as NodeDefEntity
}

export const isNodeDefAncestor = (params: {
  nodeDefAncestor: NodeDef<NodeDefType, NodeDefProps>
  nodeDefDescendant: NodeDef<NodeDefType, NodeDefProps>
}): boolean => {
  const { nodeDefAncestor, nodeDefDescendant } = params

  return Arrays.startsWith(nodeDefDescendant.meta.h, [...nodeDefAncestor.meta.h, nodeDefAncestor.uuid])
}

export const getNodeDefRoot = (params: { survey: Survey }): NodeDef<NodeDefType, NodeDefProps> => {
  const { survey } = params
  if (!survey.nodeDefs) throw new SystemError('survey.emptyNodeDefs')

  const rootDefUuidInIndex = survey.nodeDefsIndex?.rootDefUuid

  const rootDef = rootDefUuidInIndex
    ? getNodeDefByUuid({ survey, uuid: rootDefUuidInIndex })
    : getNodeDefsArray(survey).find((nodeDef) => !nodeDef.parentUuid)

  if (!rootDef) throw new SystemError('survey.rootDefNotFound')

  return rootDef
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
}): NodeDef<NodeDefType, NodeDefProps>[] => {
  const { survey, nodeDef, includeAnalysis = false } = params

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
  return includeAnalysis ? childDefs : childDefs.filter((childDef) => !childDef.analysis)
}

const getIndexInChain = (params: { survey: Survey; nodeDef: NodeDef<any> }): number => {
  const { survey, nodeDef } = params
  const areaBasedEstimatedOf = NodeDefs.getAreaBasedEstimatedOf(nodeDef)
  const areaBasedEstimatedOfNodeDef = areaBasedEstimatedOf
    ? getNodeDefByUuid({ survey, uuid: areaBasedEstimatedOf })
    : null
  const nodeDefToConsider = areaBasedEstimatedOfNodeDef ? areaBasedEstimatedOfNodeDef : nodeDef
  return nodeDefToConsider.propsAdvancedDraft?.index ?? nodeDefToConsider?.propsAdvanced?.index ?? 0
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

  if (layoutChildren.length === 0 && childrenEntitiesInOwnPageUudis.length === 0) {
    return children.map((child) => child.uuid)
  }
  const sortedChildrenDefsInSamePageUuids = NodeDefs.isLayoutRenderTypeTable(cycle)(entityDef)
    ? (layoutChildren as string[])
    : [...(layoutChildren as NodeDefEntityChildPosition[])]
        .sort(
          (gridItem1: NodeDefEntityChildPosition, gridItem2: NodeDefEntityChildPosition) =>
            gridItem1.y - gridItem2.y || gridItem1.x - gridItem2.x
        )
        .map((gridItem) => gridItem.i)

  return sortedChildrenDefsInSamePageUuids.concat(childrenEntitiesInOwnPageUudis)
}

export const getNodeDefChildrenSorted = (params: {
  survey: Survey
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
  cycle: string
  includeAnalysis?: boolean
}): NodeDef<NodeDefType, NodeDefProps>[] => {
  const { survey, nodeDef, cycle, includeAnalysis } = params

  const children = getNodeDefChildren({ survey, nodeDef, includeAnalysis })

  const childrenUuidsSortedByLayout = getNodeDefChildrenUuidsSortedByLayout({ nodeDef, cycle, children })

  return (
    children
      // exclude children not in specified cycle
      .filter((child) => child.analysis || childrenUuidsSortedByLayout.includes(child.uuid))
      .sort((child1, child2) => {
        if (includeAnalysis && (child1.analysis || child2.analysis)) {
          // analysis attribute at the end
          if (child1.analysis && !child2.analysis) return 1
          if (!child1.analysis && child2.analysis) return -1

          // sort by chain index
          const index1 = getIndexInChain({ survey, nodeDef: child1 })
          const index2 = getIndexInChain({ survey, nodeDef: child2 })
          if (index1 === index2) {
            // one node def is the area base estimated of the other
            if (NodeDefs.getAreaBasedEstimatedOf(child1)) return 1
            if (NodeDefs.getAreaBasedEstimatedOf(child2)) return -1
            // it should never happen: sort by internal id (creation time)
            return (child1.id ?? 0) - (child2.id ?? 0)
          }
          return index1 - index2
        }
        // keep sorting as defined in layout props
        return childrenUuidsSortedByLayout.indexOf(child1.uuid) - childrenUuidsSortedByLayout.indexOf(child2.uuid)
      })
  )
}

export const visitDescendantsAndSelfNodeDef = (params: {
  survey: Survey
  cycle?: string
  nodeDef: NodeDef<any>
  visitor: (nodeDef: NodeDef<any>) => void
  includeAnalysis?: boolean
  traverseMethod?: TraverseMethod
}) => {
  const { survey, cycle, nodeDef, visitor, traverseMethod = TraverseMethod.bfs, includeAnalysis = false } = params
  if (traverseMethod === TraverseMethod.bfs) {
    const queue = new Queue()

    queue.enqueue(nodeDef)

    while (!queue.isEmpty()) {
      const visitedNodeDef = queue.dequeue()

      visitor(visitedNodeDef)

      if (visitedNodeDef.type === NodeDefType.entity) {
        const childrenDefs = cycle
          ? getNodeDefChildrenSorted({ survey, nodeDef, cycle, includeAnalysis })
          : getNodeDefChildren({ survey, nodeDef: visitedNodeDef, includeAnalysis })
        queue.enqueueItems(childrenDefs)
      }
    }
  } else {
    const stack = []

    stack.push(nodeDef)

    while (stack.length > 0) {
      const visitedNodeDef = stack.pop()!

      visitor(visitedNodeDef)

      const children = getNodeDefChildren({ survey, nodeDef: visitedNodeDef, includeAnalysis })

      // add children to stack in reverse order
      for (let index = children.length - 1; index >= 0; index--) {
        const child = children[index]
        stack.push(child)
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
export const getNodeDefParentCode = (params: {
  survey: Survey
  nodeDef: NodeDef<NodeDefType, NodeDefCodeProps>
}): NodeDef<NodeDefType.code, NodeDefCodeProps> | undefined => {
  const { survey, nodeDef } = params
  const parentCodeDefUuid = nodeDef.props.parentCodeDefUuid
  if (!parentCodeDefUuid) return undefined
  const parentCodeDef = getNodeDefByUuid({ survey, uuid: parentCodeDefUuid })
  return parentCodeDef as NodeDef<NodeDefType.code, NodeDefCodeProps>
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

export const getNodeDefCategoryLevelIndex = (params: {
  survey: Survey
  nodeDef: NodeDef<NodeDefType.code, NodeDefCodeProps>
}): number => {
  const { survey, nodeDef } = params
  const parentCodeNodeDef = getNodeDefParentCode({ survey, nodeDef })
  return parentCodeNodeDef ? 1 + getNodeDefCategoryLevelIndex({ survey, nodeDef: parentCodeNodeDef }) : 0
}

export const getNodeDefKeys = (params: {
  survey: Survey
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
}): NodeDef<NodeDefType, NodeDefProps>[] => {
  const { survey, nodeDef } = params
  const children = getNodeDefChildren({ survey, nodeDef })
  return children.filter((childDef) => childDef.props.key && !childDef.deleted)
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

const { buildAndAssocNodeDefsIndex, addNodeDefToIndex, deleteNodeDefIndex } = NodeDefsIndex
export { buildAndAssocNodeDefsIndex, addNodeDefToIndex, deleteNodeDefIndex }
