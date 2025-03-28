import { Survey } from '../survey'
import { NodeDefCode, NodeDefs } from '../../nodeDef'
import { CategoryItem } from '../../category'

import {
  buildAndAssocDependencyGraph,
  addNodeDefDependencies,
  getNodeDefDependents,
  removeNodeDefDependencies,
} from './dependencies'

import {
  findNodeDefByName,
  findNodeDefByUuid,
  findNodeDefsByUuids,
  getNodeDefByName,
  getNodeDefsByUuids,
  getNodeDefByUuid,
  getNodeDefChildren,
  getNodeDefChildrenSorted,
  getNodeDefParent,
  getNodeDefAncestorMultipleEntity,
  getNodeDefRoot,
  getNodeDefSource,
  isNodeDefAncestor,
  getNodeDefKeys,
  getRootKeys,
  getNodeDefsIncludedInMultipleEntitySummary,
  getNodeDefParentCode,
  getNodeDefAncestorCodes,
  isNodeDefParentCode,
  getNodeDefCategoryLevelIndex,
  getDependentCodeAttributeDefs,
  isNodeDefEnumerator,
  getNodeDefEnumerator,
  buildAndAssocNodeDefsIndex,
  addNodeDefToIndex,
  updateNodeDefUuidByNameIndex,
  deleteNodeDefIndex,
  visitAncestorsAndSelfNodeDef,
  visitDescendantsAndSelfNodeDef,
  visitNodeDefs,
  getDescendantsInSingleEntities,
  getDependentEnumeratedEntityDefs,
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
  getDescription,
  getFieldManualLink,
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

import {
  getSecurity,
  isDataEditorViewNotOwnedRecordsAllowed,
  isVisibleInMobile,
  isRecordsDownloadInMobileAllowed,
  isRecordsUploadFromMobileAllowed,
} from './surveyGettersSecurity'

const getEnumeratingCategoryItems = (params: {
  survey: Survey
  enumerator: NodeDefCode
  parentItemUuid?: string
}): CategoryItem[] => {
  const { survey, enumerator, parentItemUuid } = params
  const categoryUuid = enumerator.props.categoryUuid
  const category = survey.categories?.[categoryUuid]
  if (!category || (NodeDefs.getParentCodeDefUuid(enumerator) && !parentItemUuid)) {
    return []
  }
  return getCategoryItems({ survey, categoryUuid: category.uuid, parentItemUuid })
}

export const Surveys = {
  getName,
  getLanguages,
  getDefaultLanguage,
  getLabel,
  getLabelOrName,
  getDescription,
  getFieldManualLink,
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

  findNodeDefByName,
  findNodeDefByUuid,
  findNodeDefsByUuids,
  getNodeDefByName,
  getNodeDefsByUuids,
  getNodeDefByUuid,
  getNodeDefChildren,
  getNodeDefChildrenSorted,
  getNodeDefParent,
  getNodeDefAncestorMultipleEntity,
  getNodeDefRoot,
  getNodeDefSource,
  isNodeDefAncestor,
  getNodeDefKeys,
  getRootKeys,
  getNodeDefsIncludedInMultipleEntitySummary,
  isNodeDefEnumerator,
  getNodeDefEnumerator,
  visitAncestorsAndSelfNodeDef,
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
  getEnumeratingCategoryItems,

  // node def code
  getNodeDefParentCode,
  getNodeDefAncestorCodes,
  isNodeDefParentCode,
  getNodeDefCategoryLevelIndex,
  getDependentCodeAttributeDefs,
  getDependentEnumeratedEntityDefs,

  // dependencies
  buildAndAssocDependencyGraph,
  addNodeDefDependencies,
  getNodeDefDependents,
  removeNodeDefDependencies,

  // index
  buildAndAssocNodeDefsIndex,
  addNodeDefToIndex,
  updateNodeDefUuidByNameIndex,
  deleteNodeDefIndex,

  // security
  getSecurity,
  isDataEditorViewNotOwnedRecordsAllowed,
  isVisibleInMobile,
  isRecordsDownloadInMobileAllowed,
  isRecordsUploadFromMobileAllowed,
}
