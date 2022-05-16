import { NodeDef, NodeDefCodeProps, NodeDefProps, NodeDefType } from '../nodeDef'
import { Node, Nodes } from '../node'
import { Record } from './record'
import { Surveys } from '../survey'
import { Arrays, Queue } from '../utils'
import { Survey, SurveyDependencyType } from '../survey/survey'
import { NodePointer } from './recordNodesUpdater/nodePointer'
import { SystemError } from '../error'
import { NodeValues } from '../node/nodeValues'

const getNodesArray = (record: Record): Node[] => Object.values(record.nodes || {})

const getNodesByDefUuid = (params: { record: Record; nodeDefUuid: string }) => {
  const { record, nodeDefUuid } = params
  return getNodesArray(record).filter((node) => node.nodeDefUuid === nodeDefUuid)
}

const getRoot = (record: Record): Node => {
  const root = getNodesArray(record).find((node) => !node.parentUuid)
  if (!root) throw new Error('Record root not found')
  return root
}

const getNodeByUuid = (params: { record: Record; uuid: string }): Node | undefined => {
  const { record, uuid } = params
  return record.nodes?.[uuid]
}

const getChildren = (params: { record: Record; parentNode: Node; childDefUuid?: string }): Node[] => {
  const { record, childDefUuid, parentNode } = params
  return getNodesArray(record).filter(
    (node) => node.parentUuid === parentNode.uuid && (!childDefUuid || node.nodeDefUuid == childDefUuid)
  )
}

const getChild = (params: { record: Record; parentNode: Node; childDefUuid: string }): Node => {
  const children = getChildren(params)
  if (children.length > 1) throw new Error('Multiple nodes found')
  if (children.length === 0) throw new Error('Child not found')
  return children[0]
}

const getParent = (params: { record: Record; node: Node }): Node | undefined => {
  const { record, node } = params
  return node.parentUuid ? getNodeByUuid({ record, uuid: node.parentUuid }) : undefined
}

const isNodeApplicable = (params: { record: Record; node: Node }) => {
  const { record, node } = params
  const nodeParent = getParent({ record, node })
  if (!nodeParent) return true

  if (isNodeApplicable({ record, node: nodeParent })) {
    return Nodes.isChildApplicable(nodeParent, node.nodeDefUuid)
  }
  return false
}

const getParentCodeAttribute = (params: {
  record: Record
  parentNode: Node
  nodeDef: NodeDef<NodeDefType.code, NodeDefCodeProps>
}): Node | undefined => {
  const { record, parentNode, nodeDef } = params
  const parentCodeDefUuid = nodeDef.props.parentCodeDefUuid
  if (!parentCodeDefUuid) return undefined
  const ancestors = getAncestorsAndSelf({ record, node: parentNode })
  for (const ancestor of ancestors) {
    const children = getChildren({ record, parentNode: ancestor, childDefUuid: parentCodeDefUuid })
    if (children.length === 1) {
      return children[0]
    }
  }
  return undefined
}

// ancestors
const visitAncestorsAndSelf = (params: { record: Record; node: Node; visitor: (node: Node) => void }) => {
  const { record, node, visitor } = params
  let currentNode: Node | undefined = node
  while (currentNode) {
    visitor(currentNode)
    currentNode = getParent({ record, node: currentNode })
  }
}

const getAncestor = (params: { record: Record; node: Node; ancestorDefUuid: string }): Node => {
  const { record, node, ancestorDefUuid } = params
  if (node.nodeDefUuid === ancestorDefUuid) return node

  let ancestor = getParent({ record, node })
  while (ancestor && ancestor.nodeDefUuid !== ancestorDefUuid) {
    ancestor = getParent({ record, node: ancestor })
  }
  if (!ancestor) {
    throw new SystemError('record.ancestorNotFound', {
      nodeUuid: node.uuid,
      nodeDefUuid: node.nodeDefUuid,
      ancestorDefUuid,
    })
  }
  return ancestor
}

/**
 * Returns the list of ancestors from the given node to the root entity
 */
const getAncestorsAndSelf = (params: { record: Record; node: Node }): Array<Node> => {
  const { record, node } = params
  const ancestors: Array<Node> = []
  visitAncestorsAndSelf({
    record,
    node,
    visitor: (currentNode) => {
      ancestors.push(currentNode)
    },
  })
  return ancestors
}

// descendants

const getDescendant = (params: { record: Record; node: Node; nodeDefDescendant: NodeDef<any> }): Node => {
  const { record, node, nodeDefDescendant } = params
  // starting from node, visit descendant entities up to referenced node parent entity
  const nodeDescendantH = nodeDefDescendant.meta.h
  const descendant = nodeDescendantH
    .slice(nodeDescendantH.indexOf(node.nodeDefUuid) + 1)
    .reduce((parentNode, childDefUuid) => getChild({ record, parentNode, childDefUuid }), node)
  return descendant
}

const isNodeDescendantOf = (params: { node: Node; ancestor: Node }): boolean => {
  const { node, ancestor } = params
  return Nodes.getHierarchy(node).includes(ancestor.uuid)
}

const visitDescendantsAndSelf = (params: { record: Record; node: Node; visitor: (node: Node) => void }): void => {
  const { record, node, visitor } = params
  const queue = new Queue()

  queue.enqueue(node)

  while (!queue.isEmpty()) {
    const node = queue.dequeue()

    visitor(node)

    const children = getChildren({ record, parentNode: node })
    queue.enqueueItems(children)
  }
}

const getCommonParentNode = (params: {
  record: Record
  node: Node
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
  dependentDef: NodeDef<NodeDefType, NodeDefProps>
}): Node | undefined => {
  const { record, node, nodeDef, dependentDef } = params
  // 1 find common parent def
  const commonParentDefUuid = Arrays.last(Arrays.intersection(nodeDef.meta.h, dependentDef.meta.h))
  if (!commonParentDefUuid) return undefined

  // 2 get ancestor node with common parent def
  return getAncestor({ record, node, ancestorDefUuid: commonParentDefUuid })
}

const getEntityKeyNodes = (params: { survey: Survey; record: Record; entity: Node }): Node[] => {
  const { survey, record, entity } = params
  const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: entity.nodeDefUuid })
  const nodeDefKeys = Surveys.getNodeDefKeys({ survey, nodeDef })
  return nodeDefKeys.map((nodeDefKey) => getChild({ record, parentNode: entity, childDefUuid: nodeDefKey.uuid }))
}

const getNodeSiblings = (params: { record: Record; node: Node; nodeDef: NodeDef<NodeDefType, NodeDefProps> }) => {
  const { record, node, nodeDef } = params
  const parentEntity = getParent({ record, node })
  if (!parentEntity) return []
  const ancestorEntity = getParent({ record, node: parentEntity })
  if (!ancestorEntity) return []
  const siblingParentEntities = getChildren({
    record,
    parentNode: ancestorEntity,
    childDefUuid: nodeDef.parentUuid,
  })

  return siblingParentEntities.reduce(
    (siblingsAcc: Node[], siblingEntity) => [
      ...siblingsAcc,
      ...getChildren({ record, parentNode: siblingEntity, childDefUuid: nodeDef.uuid }),
    ],
    []
  )
}

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
const getDependentNodePointers = (params: {
  survey: Survey
  record: Record
  node: Node
  dependencyType: SurveyDependencyType
  includeSelf?: boolean
  filterFn?: (nodePointer: NodePointer) => boolean
}) => {
  const { survey, record, node, dependencyType, includeSelf = false, filterFn = null } = params
  const nodeDefUuid = node.nodeDefUuid
  const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: nodeDefUuid })
  const dependentDefs = Surveys.getNodeDefDependents({ survey, nodeDefUuid, dependencyType })
  const nodePointers: Array<NodePointer> = []

  for (const dependentDef of dependentDefs) {
    // 1 find common parent node
    const commonParentNode = getCommonParentNode({ record, node, nodeDef, dependentDef })
    if (!commonParentNode) continue

    // 2 find descendant nodes of common parent node with nodeDefUuid = dependentDef uuid
    const isDependencyApplicable = dependencyType === SurveyDependencyType.applicable

    const nodeDefUuidDependent = isDependencyApplicable ? dependentDef.parentUuid : dependentDef.uuid

    if (nodeDefUuidDependent) {
      const nodeDependents = getNodesByDefUuid({ record, nodeDefUuid: nodeDefUuidDependent })
      for (const nodeDependent of nodeDependents) {
        if (
          isNodeDescendantOf({ node: nodeDependent, ancestor: commonParentNode }) ||
          (isDependencyApplicable && nodeDependent.uuid === commonParentNode.uuid)
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

const getAncestorCodePath = (params: {
  survey: Survey
  record: Record
  parentNode: Node
  nodeDef: NodeDef<NodeDefType.code, NodeDefCodeProps>
}): string[] => {
  const { record, parentNode, nodeDef, survey } = params

  const codesPath = []
  let ancestor: Node | undefined | null = parentNode
  let ancestorCodeAttribute: Node | undefined | null = getParentCodeAttribute({ record, parentNode: ancestor, nodeDef })

  while (ancestor && ancestorCodeAttribute) {
    const ancestorCodeDef = Surveys.getNodeDefByUuid({ survey, uuid: ancestorCodeAttribute.nodeDefUuid }) as NodeDef<
      NodeDefType.code,
      NodeDefCodeProps
    >
    ancestor = getParent({ record, node: ancestor })
    if (!ancestorCodeDef || !ancestor) {
      ancestorCodeAttribute = undefined
    } else {
      const parentCodeItemUuid = NodeValues.getItemUuid(ancestorCodeAttribute)
      if (!parentCodeItemUuid) {
        ancestorCodeAttribute = undefined
      } else {
        const parentCategoryItem = Surveys.getCategoryItemByUuid({ survey, itemUuid: parentCodeItemUuid })
        codesPath.push(parentCategoryItem?.props.code || '')
        ancestorCodeAttribute = getParentCodeAttribute({ record, parentNode: ancestor, nodeDef: ancestorCodeDef })
      }
    }
  }
  return codesPath
}

const getCategoryItemUuid = (params: {
  survey: Survey
  nodeDef: NodeDef<NodeDefType.code, NodeDefCodeProps>
  record: Record
  parentNode: Node
  code: string
}): string | undefined => {
  const { survey, nodeDef, record, parentNode, code } = params
  const categoryUuid = nodeDef.props.categoryUuid

  const codePaths = [...getAncestorCodePath({ survey, record, parentNode, nodeDef }), code]

  const item = Surveys.getCategoryItemByCodePaths({ survey, categoryUuid, codePaths })

  return item?.uuid
}

export const Records = {
  getRoot,
  getNodesArray,
  getChild,
  getChildren,
  getParent,
  getParentCodeAttribute,
  getAncestor,
  getNodeByUuid,
  getEntityKeyNodes,
  getNodeSiblings,
  isNodeApplicable,
  visitAncestorsAndSelf,
  getAncestorsAndSelf,
  getDescendant,
  visitDescendantsAndSelf,
  getDependentNodePointers,
  getCategoryItemUuid,
}
