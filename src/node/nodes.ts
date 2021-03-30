import { Node } from './node'

const isRoot = (node: Node) => !node.parentUuid

export const Nodes = {
  isRoot,
}
