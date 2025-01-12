import { NodeDef, NodeDefCountType, NodeDefs } from '../nodeDef'
import { Dates, Objects } from '../utils'
import { Node } from './node'

const isRoot = (node: Node): boolean => !node.parentUuid

const areEqual = (nodeA: Node, nodeB: Node): boolean => nodeA.uuid === nodeB.uuid

const isChildApplicable = (node: Node, nodeDefUuid: string): boolean => {
  // if child applicability is not defined for a node definition, consider it applicable
  return node.meta?.childApplicability?.[nodeDefUuid] !== false
}
const getChildrenCount = (params: { parentNode: Node; nodeDef: NodeDef<any>; countType: NodeDefCountType }): number => {
  const { parentNode, nodeDef, countType } = params
  const countIndex =
    countType === NodeDefCountType.max ? parentNode.meta?.childrenMaxCount : parentNode.meta?.childrenMinCount

  const count = countIndex?.[nodeDef.uuid]
  if (!Objects.isEmpty(count)) return count!

  // count can be a constant value, specified in the node def min/max count prop
  const nodeDefCount =
    countType === NodeDefCountType.max ? NodeDefs.getMaxCount(nodeDef) : NodeDefs.getMinCount(nodeDef)
  return nodeDefCount ? Number(nodeDefCount) : NaN
}

const getChildrenMaxCount = (params: { parentNode: Node; nodeDef: NodeDef<any> }): number =>
  getChildrenCount({ ...params, countType: NodeDefCountType.max })

const getChildrenMinCount = (params: { parentNode: Node; nodeDef: NodeDef<any> }): number =>
  getChildrenCount({ ...params, countType: NodeDefCountType.min })

const getHierarchy = (node: Node): string[] => [...(node.meta?.h ?? [])]

const getHierarchyCode = (node: Node): string[] => [...(node.meta?.hCode ?? [])]

const mergeNodes = (target: Node, ...sources: Node[] | object[]): Node =>
  Objects.deepMerge(target, ...sources) as unknown as Node

const isDefaultValueApplied = (node: Node): boolean => node?.meta?.defaultValueApplied ?? false

const isValueBlank = (node: Node): boolean => Objects.isEmpty(node.value)

const assocChildApplicability = (node: Node, nodeDefUuid: string, applicable: boolean): Node => {
  const childApplicability = { ...(node.meta?.childApplicability ?? {}) }
  if (!applicable) {
    childApplicability[nodeDefUuid] = applicable
  } else {
    delete childApplicability[nodeDefUuid]
  }
  return {
    ...node,
    meta: { ...node.meta, childApplicability },
    updated: true,
    dateModified: Dates.nowFormattedForStorage(),
  }
}

const dissocChildApplicability = (node: Node, nodeDefUuid: string) => {
  const childApplicability = { ...(node.meta?.childApplicability ?? {}) }
  delete childApplicability[nodeDefUuid]
  return {
    ...node,
    meta: { ...node.meta, childApplicability },
  }
}
const getHierarchy = (node: Node) => [...(node.meta?.h ?? [])]

const assocChildrenCount = (params: {
  node: Node
  nodeDefUuid: string
  count: number
  countType: NodeDefCountType
}): Node => {
  const { node, nodeDefUuid, count, countType } = params
  const countIndex = {
    ...((countType === NodeDefCountType.max ? node.meta?.childrenMaxCount : node.meta?.childrenMinCount) ?? {}),
  }
  if (isNaN(count)) {
    delete countIndex[nodeDefUuid]
  } else {
    countIndex[nodeDefUuid] = count
  }
  const metaUpdated = { ...node.meta }
  if (countType === NodeDefCountType.max) {
    metaUpdated.childrenMaxCount = countIndex
  } else {
    metaUpdated.childrenMinCount = countIndex
  }
  return {
    ...node,
    meta: metaUpdated,
    updated: true,
    dateModified: Dates.nowFormattedForStorage(),
  }
}

const assocChildrenMaxCount = (params: { node: Node; nodeDefUuid: string; count: number }): Node =>
  assocChildrenCount({ ...params, countType: NodeDefCountType.max })

const assocChildrenMinCount = (params: { node: Node; nodeDefUuid: string; count: number }): Node =>
  assocChildrenCount({ ...params, countType: NodeDefCountType.min })

const removeStatusFlags = (node: Node): Node => {
  delete node['created']
  delete node['deleted']
  delete node['updated']
  return node
}

export const Nodes = {
  isRoot,
  areEqual,
  isChildApplicable,
  getChildrenCount,
  getChildrenMaxCount,
  getChildrenMinCount,
  getHierarchy,
  getHierarchyCode,
  isDefaultValueApplied,
  isValueBlank,
  // update
  assocChildApplicability,
  dissocChildApplicability,
  assocChildrenCount,
  assocChildrenMaxCount,
  assocChildrenMinCount,
  mergeNodes,
  removeStatusFlags,
}
