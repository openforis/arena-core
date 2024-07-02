import {
  buildAndAssocDependencyGraph,
  addNodeDefDependencies,
  getNodeDefDependents,
  removeNodeDefDependencies,
} from './dependencies'

import {
  findNodeDefByUuid,
  findNodeDefsByUuids,
  getNodeDefByName,
  getNodeDefsByUuids,
  getNodeDefByUuid,
  getNodeDefChildren,
  getNodeDefChildrenSorted,
  getNodeDefParent,
  getNodeDefRoot,
  getNodeDefSource,
  isNodeDefAncestor,
  getNodeDefKeys,
  getNodeDefsIncludedInMultipleEntitySummary,
  getNodeDefParentCode,
  getNodeDefAncestorCodes,
  isNodeDefParentCode,
  getNodeDefCategoryLevelIndex,
  isNodeDefEnumerator,
  getNodeDefEnumerator,
  buildAndAssocNodeDefsIndex,
  addNodeDefToIndex,
  deleteNodeDefIndex,
  visitDescendantsAndSelfNodeDef,
  visitNodeDefs,
  getDescendantsInSingleEntities,
} from './nodeDefs'
import {
  getCategoryItemByCodePaths,
  getCategoryItemByUuid,
  getCategoryItemUuidByCode,
  getCategoryItems,
  getTaxonByCode,
  getTaxonByUuid,
  getTaxonVernacularNameUuid,
  includesTaxonVernacularName,
} from './refsData'

import {
  getName,
  getLanguages,
  getDefaultLanguage,
  getLabel,
  getLabelOrName,
  getCycleKeys,
  getLastCycleKey,
  getDefaultCycleKey,
  getSRSs,
  getSRSByCode,
  getSRSIndex,
  getCategoryByName,
  getCategoryByUuid,
  getTaxonomyByName,
  getTaxonomyByUuid,
} from './surveysGetters'

export const Surveys = {
  findNodeDefByUuid,
  findNodeDefsByUuids,
  getName,
  getLanguages,
  getDefaultLanguage,
  getLabel,
  getLabelOrName,
  getCycleKeys,
  getLastCycleKey,
  getDefaultCycleKey,
  getSRSs,
  getSRSByCode,
  getSRSIndex,
  getCategoryByName,
  getCategoryByUuid,
  getTaxonomyByName,
  getTaxonomyByUuid,

  getNodeDefByName,
  getNodeDefsByUuids,
  getNodeDefByUuid,
  getNodeDefChildren,
  getNodeDefChildrenSorted,
  getNodeDefParent,
  getNodeDefRoot,
  getNodeDefSource,
  isNodeDefAncestor,
  getNodeDefKeys,
  getNodeDefsIncludedInMultipleEntitySummary,
  isNodeDefEnumerator,
  getNodeDefEnumerator,
  visitDescendantsAndSelfNodeDef,
  visitNodeDefs,
  getDescendantsInSingleEntities,

  // ref data
  getCategoryItemByCodePaths,
  getCategoryItemByUuid,
  getCategoryItemUuidByCode,
  getCategoryItems,
  getTaxonByCode,
  getTaxonByUuid,
  getTaxonVernacularNameUuid,
  includesTaxonVernacularName,

  // node def code
  getNodeDefParentCode,
  getNodeDefAncestorCodes,
  isNodeDefParentCode,
  getNodeDefCategoryLevelIndex,

  // dependencies
  buildAndAssocDependencyGraph,
  addNodeDefDependencies,
  getNodeDefDependents,
  removeNodeDefDependencies,

  // index
  buildAndAssocNodeDefsIndex,
  addNodeDefToIndex,
  deleteNodeDefIndex,
}
