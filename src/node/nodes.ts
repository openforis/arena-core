import { Dates, Objects } from '../utils'
import { Node } from './node'

const isRoot = (node: Node): boolean => !node.parentUuid
const areEqual = (nodeA: Node, nodeB: Node): boolean => nodeA.uuid === nodeB.uuid
const isChildApplicable = (node: Node, nodeDefUuid: string) => {
  // if child applicability is not defined for a node definition, consider it applicable
  return node.meta?.childApplicability?.[nodeDefUuid] !== false
}
const assocChildApplicability = (node: Node, nodeDefUuid: string, applicable: boolean) => {
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

const getHierarchyCode = (node: Node) => [...(node.meta?.hCode ?? [])]

const mergeNodes = (target: Node, ...sources: Node[] | object[]): Node =>
  Objects.deepMerge(target, ...sources) as unknown as Node

const isDefaultValueApplied = (node: Node): boolean => node?.meta?.defaultValueApplied ?? false

const isValueBlank = (node: Node): boolean => Objects.isEmpty(node.value)

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
  assocChildApplicability,
  dissocChildApplicability,
  mergeNodes,
  getHierarchy,
  getHierarchyCode,
  isDefaultValueApplied,
  isValueBlank,
  removeStatusFlags,
}
