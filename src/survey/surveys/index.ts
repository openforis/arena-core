import { Category } from '../../category'
import { Taxonomy } from '../../taxonomy'
import { Survey } from '../survey'

import { buildAndAssocDependencyGraph, addNodeDefDependencies, getNodeDefDependentUuids } from './dependencies'

import {
  getNodeDefByName,
  getNodeDefsByUuids,
  getNodeDefByUuid,
  getNodeDefChildren,
  getNodeDefParent,
  getNodeDefRoot,
  getNodeDefSource,
  isNodeDefAncestor,
} from './nodeDefs'
import { getCategoryItemByCodePaths, getCategoryItemByUuid, getTaxonByCode, getTaxonByUuid } from './refsData'

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

export const Surveys = {
  getNodeDefByName,
  getNodeDefsByUuids,
  getNodeDefByUuid,
  getNodeDefChildren,
  getNodeDefParent,
  getNodeDefRoot,
  getNodeDefSource,
  isNodeDefAncestor,
  getCategoryByName,
  getCategoryItemByCodePaths,
  getCategoryItemByUuid,
  getTaxonByCode,
  getTaxonByUuid,
  getTaxonomyByName,

  // dependencies
  buildAndAssocDependencyGraph,
  addNodeDefDependencies,
  getNodeDefDependentUuids,
}
