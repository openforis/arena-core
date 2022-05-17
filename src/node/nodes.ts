import { Objects } from '../utils'
import { Node } from './node'

const isRoot = (node: Node): boolean => !node.parentUuid
const areEqual = (nodeA: Node, nodeB: Node): boolean => nodeA.uuid === nodeB.uuid
const isChildApplicable = (node: Node, nodeDefUuid: string) => {
  // if child applicability is not defined for a node definition, consider it applicable
  return node.meta?.childApplicability?.[nodeDefUuid] !== false
}
const assocChildApplicability = (node: Node, nodeDefUuid: string, applicable: boolean) => {
  const childApplicability = { ...(node.meta?.childApplicability || {}) }
  if (!applicable) {
    childApplicability[nodeDefUuid] = applicable
  } else {
    delete childApplicability[nodeDefUuid]
  }
  return { ...node, meta: { ...node.meta, childApplicability } }
}
const getHierarchy = (node: Node) => [...(node.meta?.h || [])]

const mergeNodes = (target: Node, ...sources: Node[] | object[]): Node =>
  Objects.deepMerge(target, ...sources) as unknown as Node

const isDefaultValueApplied = (node: Node): boolean => node?.meta?.defaultValueApplied || false

const isValueBlank = (node: Node): boolean => Objects.isEmpty(node.value)

export const Nodes = {
  isRoot,
  areEqual,
  isChildApplicable,
  assocChildApplicability,
  mergeNodes,
  getHierarchy,
  isDefaultValueApplied,
  isValueBlank,
}
