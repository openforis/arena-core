import { Node } from './node'

const isRoot = (node: Node): boolean => !node.parentUuid
const areEqual = (nodeA: Node, nodeB: Node): boolean => nodeA.uuid === nodeB.uuid

export const Nodes = {
  isRoot,
  areEqual,
}
