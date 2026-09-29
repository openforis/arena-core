import { Node, Nodes, NodesMap } from '../../node'
import { Record, RecordNodesIndex } from '../record'

/**
 * Returns the position of the given internal ID in the sorted array, or the position where it should be inserted
 * (as a negative number: -(insertion position) - 1) if not found.
 */
const binarySearch = (internalIds: number[], internalId: number): number => {
  let low = 0
  let high = internalIds.length - 1
  while (low <= high) {
    const mid = (low + high) >>> 1
    const midValue = internalIds[mid]
    if (midValue < internalId) {
      low = mid + 1
    } else if (midValue > internalId) {
      high = mid - 1
    } else {
      return mid
    }
  }
  return -low - 1
}

/**
 * Applies changes to a nodes index.
 * When sideEffect is false, every object or array in the index is copied (only once) before being modified,
 * so the original index is never modified.
 */
class RecordNodesIndexMutator {
  index: RecordNodesIndex
  private readonly sideEffect: boolean
  private readonly copies: Set<object> = new Set()

  constructor(index: RecordNodesIndex, sideEffect: boolean) {
    this.sideEffect = sideEffect
    this.index = sideEffect ? index : this.registerCopy({ ...index })
  }

  private registerCopy<T extends object>(obj: T): T {
    this.copies.add(obj)
    return obj
  }

  /**
   * Returns a modifiable version of the child with the given key (the parent must be modifiable).
   */
  private getWritableChild(parent: any, key: string | number, createIfMissing: boolean): any {
    const child = parent[key]
    if (child === undefined) {
      if (!createIfMissing) return undefined
      const childCreated = this.registerCopy({})
      parent[key] = childCreated
      return childCreated
    }
    if (this.sideEffect || this.copies.has(child)) return child
    const childCopy = this.registerCopy(Array.isArray(child) ? [...child] : { ...child })
    parent[key] = childCopy
    return childCopy
  }

  private addToList(parent: any, key: string | number, internalId: number): void {
    const internalIds: number[] | undefined = parent[key]
    if (!internalIds) {
      parent[key] = this.registerCopy([internalId])
      return
    }
    // internal IDs are usually added in ascending order: append without searching the insert position when possible
    const last = internalIds.at(-1) ?? 0
    if (internalId === last) return
    const position = internalId > last ? -internalIds.length - 1 : binarySearch(internalIds, internalId)
    if (position >= 0) return // already in the list
    const internalIdsWritable: number[] = this.getWritableChild(parent, key, false)
    internalIdsWritable.splice(-position - 1, 0, internalId)
  }

  /**
   * Removes the internal ID from the list with the given key; the list is removed if it becomes empty.
   * Returns true if the parent object has become empty.
   */
  private removeFromList(parent: any, key: string | number, internalId: number): boolean {
    const internalIds: number[] | undefined = parent[key]
    if (!internalIds) return false
    const position = binarySearch(internalIds, internalId)
    if (position < 0) return false
    if (internalIds.length === 1) {
      delete parent[key]
      return Object.keys(parent).length === 0
    }
    const internalIdsWritable: number[] = this.getWritableChild(parent, key, false)
    internalIdsWritable.splice(position, 1)
    return false
  }

  addNode(node: Node): void {
    const { iId: nodeInternalId, nodeDefUuid, pIId } = node
    const index = this.index

    if (pIId) {
      // nodes by parent and child def uuid
      const nodesByParentAndChildDef = this.getWritableChild(index, 'nodesByParentAndChildDef', true)
      const nodesByChildDef = this.getWritableChild(nodesByParentAndChildDef, pIId, true)
      this.addToList(nodesByChildDef, nodeDefUuid, nodeInternalId)
    } else {
      // root entity index
      index.nodeRootIId = nodeInternalId
    }
    // nodes by def uuid
    const nodesByDef = this.getWritableChild(index, 'nodesByDef', true)
    this.addToList(nodesByDef, nodeDefUuid, nodeInternalId)

    // code dependents
    const hierarchyCode = Nodes.getHierarchyCode(node)
    if (hierarchyCode.length > 0) {
      const nodeCodeDependents = this.getWritableChild(index, 'nodeCodeDependents', true)
      for (const ancestorCodeAttributeInternalId of hierarchyCode) {
        this.addToList(nodeCodeDependents, ancestorCodeAttributeInternalId, nodeInternalId)
      }
    }
  }

  removeNode(node: Node): void {
    const { iId: nodeInternalId, nodeDefUuid, pIId } = node
    const index = this.index

    if (pIId) {
      // remove from nodes by parent and child def
      if (index.nodesByParentAndChildDef?.[pIId]?.[nodeDefUuid]) {
        const nodesByParentAndChildDef = this.getWritableChild(index, 'nodesByParentAndChildDef', false)
        const nodesByChildDef = this.getWritableChild(nodesByParentAndChildDef, pIId, false)
        if (this.removeFromList(nodesByChildDef, nodeDefUuid, nodeInternalId)) {
          delete nodesByParentAndChildDef[pIId]
        }
      }
    } else if (index.nodeRootIId === nodeInternalId) {
      delete index.nodeRootIId
    }
    // remove from nodes by def uuid
    if (index.nodesByDef?.[nodeDefUuid]) {
      const nodesByDef = this.getWritableChild(index, 'nodesByDef', false)
      this.removeFromList(nodesByDef, nodeDefUuid, nodeInternalId)
    }
    // remove from code dependents
    if (index.nodeCodeDependents) {
      const hierarchyCode = Nodes.getHierarchyCode(node)
      const hasOwnDependents = !!index.nodeCodeDependents[nodeInternalId]
      if (hierarchyCode.length > 0 || hasOwnDependents) {
        const nodeCodeDependents = this.getWritableChild(index, 'nodeCodeDependents', false)
        for (const ancestorCodeAttributeInternalId of hierarchyCode) {
          this.removeFromList(nodeCodeDependents, ancestorCodeAttributeInternalId, nodeInternalId)
        }
        delete nodeCodeDependents[nodeInternalId]
      }
    }
  }
}

const addNodes =
  (nodes: NodesMap, sideEffect = false) =>
  (nodesIndex: RecordNodesIndex): RecordNodesIndex => {
    const mutator = new RecordNodesIndexMutator(nodesIndex, sideEffect)
    // nodes map keys are internal IDs, iterated in ascending order: internal IDs are appended to the index lists
    for (const node of Object.values(nodes)) {
      mutator.addNode(node)
    }
    return mutator.index
  }

const addNode =
  (node: Node, sideEffect = false) =>
  (index: RecordNodesIndex): RecordNodesIndex =>
    addNodes({ [node.iId]: node }, sideEffect)(index)

const initializeIndex = (record: Record): RecordNodesIndex => addNodes(record.nodes ?? {}, true)({})

const removeNodes =
  (nodes: Node[], sideEffect = false) =>
  (index: RecordNodesIndex): RecordNodesIndex => {
    const mutator = new RecordNodesIndexMutator(index, sideEffect)
    for (const node of nodes) {
      mutator.removeNode(node)
    }
    return mutator.index
  }

const removeNode =
  (node: Node, sideEffect = false) =>
  (index: RecordNodesIndex): RecordNodesIndex =>
    removeNodes([node], sideEffect)(index)

export const RecordNodesIndexUpdater = {
  addNode,
  addNodes,
  initializeIndex,
  removeNode,
  removeNodes,
}
