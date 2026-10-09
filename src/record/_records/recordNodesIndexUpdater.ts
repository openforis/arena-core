import { Node, Nodes } from '../../node'
import { Objects } from '../../utils'
import { Record, RecordNodesIndex } from '../record'

const keys = {
  nodeRootUuid: 'nodeRootUuid',
  nodesByParentAndChildDef: 'nodesByParentAndChildDef',
  nodesByDef: 'nodesByDef',
  nodeCodeDependents: 'nodeCodeDependents',
}

const sortNodesByIdOrCreationDate = (nodeA: Node, nodeB: Node): number => {
  if (!nodeA.parentUuid) return -1
  if (!nodeB.parentUuid) return 1
  // read the hierarchy length directly: Nodes.getHierarchy copies the array on every comparison
  const hierarchyDepthA = nodeA.meta?.h?.length ?? 0
  const hierarchyDepthB = nodeB.meta?.h?.length ?? 0
  const depthDiff = hierarchyDepthA - hierarchyDepthB
  if (depthDiff !== 0) return depthDiff
  if (nodeA.id && nodeB.id) return nodeA.id - nodeB.id
  if (nodeA.dateCreated && nodeB.dateCreated) return nodeA.dateCreated.localeCompare(nodeB.dateCreated)
  return 0
}

/**
 * Mutable copy of a nodes index, used to apply many changes to it at once.
 * When sideEffect is false, every object along a modified path is copied only the first time it is modified
 * (copy on write): applying N changes costs one copy of each touched object instead of N copies.
 */
class NodesIndexDraft {
  readonly index: RecordNodesIndex
  private readonly sideEffect: boolean
  private readonly copiedObjects = new Set<object>()

  constructor(index: RecordNodesIndex, sideEffect: boolean) {
    this.sideEffect = sideEffect
    this.index = sideEffect ? index : this.markCopied({ ...index })
  }

  private markCopied<T extends object>(obj: T): T {
    this.copiedObjects.add(obj)
    return obj
  }

  private getWritableChild(parent: any, key: string, createIfMissing: boolean): any {
    const child = parent[key]
    if (child === undefined || child === null) {
      if (!createIfMissing) return undefined
      const childCreated = this.markCopied({})
      parent[key] = childCreated
      return childCreated
    }
    if (this.sideEffect || this.copiedObjects.has(child)) return child
    const childCopy = this.markCopied({ ...child })
    parent[key] = childCopy
    return childCopy
  }

  set(path: string[], value: any): void {
    let current: any = this.index
    for (let i = 0; i < path.length - 1; i++) {
      current = this.getWritableChild(current, path[i], true)
    }
    current[path[path.length - 1]] = value
  }

  /**
   * Deletes the value at the specified path, then removes the objects along the path left empty.
   */
  delete(path: string[]): void {
    const containers: any[] = [this.index]
    let current: any = this.index
    for (let i = 0; i < path.length - 1; i++) {
      if (current[path[i]] === undefined) return
      current = this.getWritableChild(current, path[i], false)
      containers.push(current)
    }
    delete current[path[path.length - 1]]
    for (let i = path.length - 2; i >= 0; i--) {
      if (!Objects.isEmpty(containers[i + 1])) break
      delete containers[i][path[i]]
    }
  }

  addNode(node: Node): void {
    const { uuid: nodeUuid, nodeDefUuid, parentUuid } = node
    if (parentUuid) {
      // nodes by parent and child def uuid
      this.set([keys.nodesByParentAndChildDef, parentUuid, nodeDefUuid, nodeUuid], true)
    } else {
      // root entity index
      this.index.nodeRootUuid = nodeUuid
    }
    // nodes by def uuid
    this.set([keys.nodesByDef, nodeDefUuid, nodeUuid], true)
    // code dependents
    for (const ancestorCodeAttributeUuid of node.meta?.hCode ?? []) {
      this.set([keys.nodeCodeDependents, ancestorCodeAttributeUuid, nodeUuid], true)
    }
  }

  removeNode(node: Node): void {
    const { uuid: nodeUuid, parentUuid, nodeDefUuid } = node
    if (parentUuid) {
      this.delete([keys.nodesByParentAndChildDef, parentUuid, nodeDefUuid, nodeUuid])
    } else {
      delete this.index.nodeRootUuid
    }
    this.delete([keys.nodesByDef, nodeDefUuid, nodeUuid])
    // code dependents
    for (const ancestorCodeAttributeUuid of Nodes.getHierarchyCode(node)) {
      this.delete([keys.nodeCodeDependents, ancestorCodeAttributeUuid, nodeUuid])
    }
    this.delete([keys.nodeCodeDependents, nodeUuid])
  }
}

const addNodes =
  (nodes: { [key: string]: Node }, sideEffect = false, sortNodes = false) =>
  (index: RecordNodesIndex): RecordNodesIndex => {
    const draft = new NodesIndexDraft(index, sideEffect)
    const nodesArray = Object.values(nodes)
    if (sortNodes) {
      nodesArray.sort(sortNodesByIdOrCreationDate)
    }
    for (const node of nodesArray) {
      draft.addNode(node)
    }
    return draft.index
  }

const addNode =
  (node: Node) =>
  (index: RecordNodesIndex): RecordNodesIndex =>
    addNodes({ [node.uuid]: node })(index)

const initializeIndex = (record: Record): RecordNodesIndex => addNodes(record.nodes ?? {}, true, true)({})

const removeNodes =
  (nodes: Node[], sideEffect = false) =>
  (index: RecordNodesIndex): RecordNodesIndex => {
    const draft = new NodesIndexDraft(index, sideEffect)
    for (const node of nodes) {
      draft.removeNode(node)
    }
    return draft.index
  }

const removeNode =
  (node: Node, sideEffect = false) =>
  (index: RecordNodesIndex): RecordNodesIndex =>
    removeNodes([node], sideEffect)(index)

const _isSameHierarchyCode = (nodeA: Node, nodeB: Node): boolean => {
  const hCodeA = nodeA.meta?.hCode ?? []
  const hCodeB = nodeB.meta?.hCode ?? []
  return hCodeA.length === hCodeB.length && hCodeA.every((uuid, index) => uuid === hCodeB[index])
}

/**
 * Returns true if the index entries of the specified node would not change when the node replaces the previous version of it.
 */
const isNodeIndexUnchanged = (params: { index: RecordNodesIndex; node: Node; nodePrev?: Node }): boolean => {
  const { index, node, nodePrev } = params
  if (!nodePrev) return false
  const { uuid, parentUuid, nodeDefUuid } = node
  if (parentUuid !== nodePrev.parentUuid || nodeDefUuid !== nodePrev.nodeDefUuid) return false
  if (!_isSameHierarchyCode(node, nodePrev)) return false
  if (!index.nodesByDef?.[nodeDefUuid]?.[uuid]) return false
  return parentUuid
    ? !!index.nodesByParentAndChildDef?.[parentUuid]?.[nodeDefUuid]?.[uuid]
    : index.nodeRootUuid === uuid
}

export const RecordNodesIndexUpdater = {
  addNode,
  addNodes,
  initializeIndex,
  isNodeIndexUnchanged,
  removeNode,
  removeNodes,
}
