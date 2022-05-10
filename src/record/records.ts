import { NodeDef } from '../nodeDef'
import { Node } from '../node'
import { Record } from './record'
import { Surveys } from '../survey'
import { Arrays } from '../utils'

const getNodes = (record: Record): Node[] => Object.values(record.nodes || {})

const getRoot = (record: Record): Node => {
  const root = getNodes(record).find((node) => !node.parentUuid)
  if (!root) throw new Error('Record root not found')
  return root
}

const getChildren = (params: { record: Record; parentNode: Node; childDefUuid: string }): Node[] => {
  const { record, childDefUuid, parentNode } = params
  return getNodes(record).filter((node) => node.parentUuid === parentNode.uuid && node.nodeDefUuid == childDefUuid)
}

const getChild = (params: { record: Record; parentNode: Node; childDefUuid: string }): Node => {
  const children = getChildren(params)
  if (children.length > 1) throw new Error('Multiple nodes found')
  if (children.length === 0) throw new Error('Child not found')
  return children[0]
}

const getParent = (params: { record: Record; node: Node }): Node | undefined => {
  const { record, node } = params
  const nodes = getNodes(record)
  const parent = nodes.find((n) => n.uuid === node.parentUuid)
  return parent
}

const getAncestor = (params: { record: Record; node: Node; ancestorDefUuid: string }): Node => {
  const { record, node, ancestorDefUuid } = params
  if (node.nodeDefUuid === ancestorDefUuid) return node

  let ancestor = getParent({ record, node })
  while (ancestor && ancestor.nodeDefUuid !== ancestorDefUuid) {
    ancestor = getParent({ record, node: ancestor })
  }
  if (!ancestor) {
    throw new Error(
      `Ancestor with ancestorDefUuid ${ancestorDefUuid} not found for node with uuid ${node.uuid} and node def uuid ${node.nodeDefUuid}`
    )
  }
  return ancestor
}

const getDescendant = (params: { record: Record; node: Node; nodeDefDescendant: NodeDef<any> }): Node => {
  const { record, node, nodeDefDescendant } = params
  // starting from node, visit descendant entities up to referenced node parent entity
  const nodeDescendantH = nodeDefDescendant.meta.h
  const descendant = nodeDescendantH
    .slice(nodeDescendantH.indexOf(node.nodeDefUuid) + 1)
    .reduce((parentNode, childDefUuid) => getChild({ record, parentNode, childDefUuid }), node)
  return descendant
}

const getNodeByUuid = (record: Record, uuid: string): Node | undefined => record.nodes?.[uuid]

// ancestors
const getParentNode = (record: Record, node: Node): Node | undefined =>
  node.parentUuid ? getNodeByUuid(record, node.parentUuid) : undefined

const visitAncestorsAndSelf = (params: { record: Record; node: Node; visitor: (node: Node) => void }) => {
  const { record, node, visitor } = params
  let currentNode: Node | undefined = node
  while (currentNode) {
    visitor(currentNode)
    currentNode = getParentNode(record, currentNode)
  }
}

/**
 * Returns the list of ancestors from the given node to the root entity
 */
const getAncestorsAndSelf = (node) => (record) => {
  const ancestors = []
  visitAncestorsAndSelf({
    node,
    visitor: (currentNode) => {
      ancestors.push(currentNode)
    },
  })(record)
  return ancestors
}

const getAncestorByNodeDefUuid = (node, ancestorDefUuid) => (record) =>
  R.pipe(
    getParentNode(node),
    (parentNode) => getAncestorsAndSelf(parentNode)(record),
    R.find((ancestor) => Node.getNodeDefUuid(ancestor) === ancestorDefUuid)
  )(record)

/**
 * ==== dependency
 */
/**
 * Returns a list of dependent node pointers.
 * Every item in the list is in the format:
 * {
 *   nodeCtx, //context node
 *   nodeDef, //node definition
 * }
 */
export const getDependentNodePointers = (params = { survey, record, node, dependencyType, includeSelf, filterFn }) => {
  const { survey, record, node, dependencyType, includeSelf = false, filterFn = null } = params
  const nodeDefUuid = node.nodeDefUuid
  const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: nodeDefUuid })
  const dependentUuids = Surveys.getNodeDefDependentUuids({ survey, nodeDefUuid, dependencyType })
  const nodePointers = []

  if (dependentUuids) {
    const dependentDefs = Surveys.getNodeDefsByUuids({ survey, uuids: dependentUuids })

    for (const dependentDef of dependentDefs) {
      // 1 find common parent def
      const commonParentDefUuid = Arrays.intersection(nodeDef.meta.h, dependentDef.meta.h).at(-1) // .slice(-1)[0]

      // 2 find common parent node
      const commonParentNode = getAncestorByNodeDefUuid(node, commonParentDefUuid)(record)

      // 3 find descendant nodes of common parent node with nodeDefUuid = dependentDef uuid
      const isDependencyApplicable = dependencyType === SurveyDependencies.dependencyTypes.applicable

      const nodeDefUuidDependent = isDependencyApplicable
        ? NodeDef.getParentUuid(dependentDef)
        : NodeDef.getUuid(dependentDef)

      const nodeDependents = getNodesByDefUuid(nodeDefUuidDependent)(record)
      for (const nodeDependent of nodeDependents) {
        if (
          Node.isDescendantOf(commonParentNode)(nodeDependent) ||
          (isDependencyApplicable && Node.getUuid(nodeDependent) === Node.getUuid(commonParentNode))
        ) {
          const nodePointer = {
            nodeDef: dependentDef,
            nodeCtx: nodeDependent,
          }
          if (filterFn === null || filterFn(nodePointer)) {
            nodePointers.push(nodePointer)
          }
        }
      }
    }
  }

  if (includeSelf) {
    const nodePointerSelf = {
      nodeDef,
      nodeCtx: node,
    }
    if (filterFn === null || filterFn(nodePointerSelf)) {
      nodePointers.push(nodePointerSelf)
    }
  }

  return nodePointers
}

// copy missing functions from RecordReader in arena

export const Records = { getRoot, getChild, getChildren, getParent, getAncestor, getDescendant }
