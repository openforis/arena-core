import { Category } from '../../category'
import { LanguageCode } from '../../language'
import { SRS, SRSIndex } from '../../srs'
import { Taxonomy } from '../../taxonomy'
import { Arrays, Objects } from '../../utils'
import { Survey } from '../survey'

import {
  buildAndAssocDependencyGraph,
  addNodeDefDependencies,
  getNodeDefDependents,
  removeNodeDefDependencies,
} from './dependencies'

import {
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
  getNodeDefParentCode,
  isNodeDefParentCode,
  getNodeDefCategoryLevelIndex,
  isNodeDefEnumerator,
  getNodeDefEnumerator,
  buildAndAssocNodeDefsIndex,
  addNodeDefToIndex,
  deleteNodeDefIndex,
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

const getName = (survey: Survey): string => survey.props.name

const getLanguages = (survey: Survey): LanguageCode[] => survey.props.languages

const getDefaultLanguage = (survey: Survey): LanguageCode => getLanguages(survey)[0]

const getLabel =
  (langCode?: LanguageCode) =>
  (survey: Survey): string | undefined => {
    const languageCode = langCode ?? getDefaultLanguage(survey)
    return survey.props.labels?.[languageCode]
  }

const getCategoryByName = (params: { survey: Survey; categoryName: string }): Category | undefined => {
  const { survey, categoryName } = params
  return survey.categories
    ? Object.values(survey.categories).find((category) => category.props.name === categoryName)
    : undefined
}

const getTaxonomyByName = (params: { survey: Survey; taxonomyName: string }): Taxonomy | undefined => {
  const { survey, taxonomyName } = params
  return survey.taxonomies
    ? Object.values(survey.taxonomies).find((taxonomy) => taxonomy.props.name === taxonomyName)
    : undefined
}

const getCycleKeys = (survey: Survey): string[] => {
  const cycles = survey.props?.cycles || {}
  return Object.keys(cycles)
}

const getLastCycleKey = (survey: Survey): string => Arrays.last(getCycleKeys(survey)) as string

const getDefaultCycleKey = (survey: Survey) => {
  const defaultCycleKey = survey.props?.defaultCycleKey
  return Objects.isEmpty(defaultCycleKey) ? getLastCycleKey(survey) : defaultCycleKey
}

const getSRSs = (survey: Survey): SRS[] =>
  survey.props?.srs ??
  // backwards compatibility with Arena: srs stored in info in UI
  (survey as any).info?.props?.srs ??
  []

const getSRSIndex = (survey: Survey): SRSIndex =>
  getSRSs(survey).reduce((acc: SRSIndex, srs) => {
    acc[srs.code] = srs
    return acc
  }, {})

const getSRSByCode =
  (code: string) =>
  (survey: Survey): SRS | undefined =>
    getSRSIndex(survey)[code]

export const Surveys = {
  getName,
  getLanguages,
  getDefaultLanguage,
  getLabel,
  getCycleKeys,
  getLastCycleKey,
  getDefaultCycleKey,
  getSRSs,
  getSRSByCode,
  getSRSIndex,
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
  isNodeDefEnumerator,
  getNodeDefEnumerator,

  // ref data
  getCategoryByName,
  getCategoryItemByCodePaths,
  getCategoryItemByUuid,
  getCategoryItemUuidByCode,
  getCategoryItems,
  getTaxonByCode,
  getTaxonByUuid,
  getTaxonomyByName,
  getTaxonVernacularNameUuid,
  includesTaxonVernacularName,

  // node def code
  getNodeDefParentCode,
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
