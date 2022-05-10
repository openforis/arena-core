import { Node } from './node'

const isRoot = (node: Node): boolean => !node.parentUuid
const areEqual = (nodeA: Node, nodeB: Node): boolean => nodeA.uuid === nodeB.uuid
const isChildApplicable = (node: Node, nodeDefUuid: string) => node.meta.childApplicability?.[nodeDefUuid] || false
const assocChildApplicability = (node: Node, nodeDefUuid: string, applicable: boolean) => {
  const childApplicability = { ...(node.meta.childApplicability || {}) }
  if (!applicable) {
    childApplicability[nodeDefUuid] = applicable
  } else {
    delete childApplicability[nodeDefUuid]
  }
  return { ...node, meta: { ...node.meta, childApplicability } }
}

export const Nodes = {
  isRoot,
  areEqual,
  isChildApplicable,
  assocChildApplicability,
}
