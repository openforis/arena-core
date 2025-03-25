import {
  getCycle,
  getRoot,
  getNodes,
  getNodesArray,
  getNodeByUuid,
  getNodesByUuids,
  getNodesByDefUuid,
  getChild,
  getChildren,
  getParent,
  getParentCodeAttribute,
  getDependentCodeAttributes,
  getAncestor,
  getEntityKeyNodes,
  getEntityKeyNodesByDefUuid,
  getEntityKeyValues,
  getEntityKeyValuesByDefUuid,
  getNodeSiblings,
  getNodeIndex,
  isNodeApplicable,
  visitAncestorsAndSelf,
  getAncestorsAndSelf,
  getDescendant,
  getDescendantsOrSelf,
  isDescendantOf,
  visitDescendantsAndSelf,
  getDependentNodePointers,
  findEntityByKeyValues,
  findEntityWithSameKeysInAnotherRecord,
  getCategoryItemUuid,
} from './_records/recordGetters'
import { addNode, addNodes } from './_records/recordUpdater'
import { deleteNode, deleteNodes } from './recordNodesUpdater/recordNodesDeleter'

export const Records = {
  // READ
  getCycle,
  getRoot,
  getNodes,
  getNodesArray,
  getNodeByUuid,
  getNodesByUuids,
  getNodesByDefUuid,
  getChild,
  getChildren,
  getParent,
  getParentCodeAttribute,
  getDependentCodeAttributes,
  getAncestor,
  getEntityKeyNodes,
  getEntityKeyNodesByDefUuid,
  getEntityKeyValues,
  getEntityKeyValuesByDefUuid,
  getNodeSiblings,
  getNodeIndex,
  isNodeApplicable,
  visitAncestorsAndSelf,
  getAncestorsAndSelf,
  getDescendant,
  getDescendantsOrSelf,
  isDescendantOf,
  visitDescendantsAndSelf,
  getDependentNodePointers,
  findEntityByKeyValues,
  findEntityWithSameKeysInAnotherRecord,
  getCategoryItemUuid,

  // UPDATE
  addNode,
  addNodes,
  deleteNode,
  deleteNodes,
}

export type { RecordUpdateOptions } from './_records/recordUpdateOptions'
