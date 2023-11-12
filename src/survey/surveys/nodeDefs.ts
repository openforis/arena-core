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
import { Arrays } from '../../utils'
import { SystemError } from '../../error'
import * as NodeDefsReader from './_nodeDefs/nodeDefsReader'
import * as NodeDefsIndex from './_nodeDefs/nodeDefsIndex'

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
  if (!includeAnalysis) {
    childDefs = childDefs.filter((childDef) => !childDef.analysis)
  }
  if (!includeLayoutElements) {
    childDefs.filter((childDef) => !NodeDefs.isLayoutElement(childDef))
  }
  return childDefs
}

export const getNodeDefChildrenSorted = (params: {
  survey: Survey
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
  cycle: string
  includeAnalysis?: boolean
  includeLayoutElements?: boolean
}): NodeDef<NodeDefType, NodeDefProps>[] => {
  const { survey, nodeDef, cycle, includeAnalysis, includeLayoutElements } = params

  const children = getNodeDefChildren({ survey, nodeDef, includeAnalysis, includeLayoutElements })

  const entityDef = nodeDef as NodeDefEntity

  const childrenEntitiesInOwnPageUudis = NodeDefs.getChildrenEntitiesInOwnPageUudis(cycle)(entityDef) ?? []
  const layoutChildren = NodeDefs.getLayoutChildren(cycle)(entityDef) ?? []

  if (layoutChildren.length === 0 && childrenEntitiesInOwnPageUudis.length === 0) {
    return children
  }
  const sortedChildrenDefsInSamePageUuids = NodeDefs.isLayoutRenderTypeTable(cycle)(entityDef)
    ? (layoutChildren as string[])
    : [...(layoutChildren as NodeDefEntityChildPosition[])]
        .sort(
          (gridItem1: NodeDefEntityChildPosition, gridItem2: NodeDefEntityChildPosition) =>
            gridItem1.y - gridItem2.y || gridItem1.x - gridItem2.x
        )
        .map((gridItem) => gridItem.i)

  const sortedChildrenUuids = sortedChildrenDefsInSamePageUuids.concat(childrenEntitiesInOwnPageUudis)

  return (
    children
      // exclude children not in specified cycle
      .filter((child) => sortedChildrenUuids.includes(child.uuid))
      .sort((child1, child2) => sortedChildrenUuids.indexOf(child1.uuid) - sortedChildrenUuids.indexOf(child2.uuid))
  )
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
