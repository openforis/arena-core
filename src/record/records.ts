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
  getAncestorCodePath,
  getDependentCodeAttributes,
  getAncestor,
  getEntityKeyNodes,
  getEntityKeyNodesByDefUuid,
  getEntityKeyValues,
  getEntityKeyValuesByDefUuid,
  getEntitySiblings,
  getAttributeSiblings,
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
  isNodeEmpty,
  isNodeFilledByUser,
  isEmpty,
} from './_records/recordGetters'
import { addNode, addNodes } from './_records/recordUpdater'
import { getEnumeratingCategoryItems, findDependentEnumeratedEntityDefsNotEmpty } from './_records/recordUtils'
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
  getAncestorCodePath,
  getDependentCodeAttributes,
  getAncestor,
  getEntityKeyNodes,
  getEntityKeyNodesByDefUuid,
  getEntityKeyValues,
  getEntityKeyValuesByDefUuid,
  getEntitySiblings,
  getAttributeSiblings,
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
  isNodeEmpty,
  isNodeFilledByUser,
  isEmpty,
  // UPDATE
  addNode,
  addNodes,
  deleteNode,
  deleteNodes,
  // Utils
  getEnumeratingCategoryItems,
  findDependentEnumeratedEntityDefsNotEmpty,
}

export type { RecordUpdateOptions } from './_records/recordUpdateOptions'
