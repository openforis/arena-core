import {
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
  getEntityKeyValues,
  getNodeSiblings,
  isNodeApplicable,
  visitAncestorsAndSelf,
  getAncestorsAndSelf,
  getDescendant,
  getDescendantsOrSelf,
  isDescendantOf,
  visitDescendantsAndSelf,
  getDependentNodePointers,
  getCategoryItemUuid,
} from './_records/recordGetters'

import { addNode, addNodes, deleteNode } from './_records/recordUpdater'

export const Records = {
  // READ
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
  getEntityKeyValues,
  getNodeSiblings,
  isNodeApplicable,
  visitAncestorsAndSelf,
  getAncestorsAndSelf,
  getDescendant,
  getDescendantsOrSelf,
  isDescendantOf,
  visitDescendantsAndSelf,
  getDependentNodePointers,
  getCategoryItemUuid,

  // UPDATE
  addNode,
  addNodes,
  deleteNode,
}

export type { RecordUpdateOptions } from './_records/recordUpdater'
