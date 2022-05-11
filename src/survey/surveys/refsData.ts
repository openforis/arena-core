import { Survey } from '../survey'
import { CategoryItem } from '../../category'
import { Taxon } from '../../taxonomy'
import { NodeDef, NodeDefCodeProps, NodeDefType } from '../../nodeDef'
import { Record } from '../../record'
import { getNodeDefCategoryLevelIndex } from './nodeDefs'

export const getCategoryItemByUuid = (params: { survey: Survey; itemUuid: string }): CategoryItem | undefined => {
  const { survey, itemUuid } = params
  return survey.refData?.categoryItemIndex[itemUuid]
}

export const getCategoryItemByCode = (params: {
  survey: Survey
  categoryUuid: string
  parentItemUuid: string | undefined
  code: string
}) => {
  const { survey, categoryUuid, parentItemUuid } = params
  return R.path([keys.refData, keys.categoryItemUuidIndex, categoryUuid, parentItemUuid, code])
}

export const getCategoryItemByCodePaths = (params: {
  survey: Survey
  categoryUuid: string
  codePaths: string[]
}): CategoryItem | undefined => {
  const { survey, categoryUuid, codePaths } = params
  const itemUuid = codePaths.reduce(
    (currentParentUuid: string | undefined, code) =>
      currentParentUuid
        ? survey.refData?.categoryItemUuidIndex?.[categoryUuid]?.[currentParentUuid]?.[code]
        : undefined,
    'null'
  )
  return itemUuid ? getCategoryItemByUuid({ survey, itemUuid }) : undefined
}

export const getTaxonByUuid = (params: { survey: Survey; taxonUuid: string }): Taxon | undefined => {
  const { survey, taxonUuid } = params
  return survey.refData?.taxonIndex?.[taxonUuid]
}

export const getTaxonByCode = (params: {
  survey: Survey
  taxonomyUuid: string
  taxonCode: string
}): Taxon | undefined => {
  const { survey, taxonomyUuid, taxonCode } = params
  const taxonUuid = survey.refData?.taxonUuidIndex?.[taxonomyUuid]?.[taxonCode]
  return taxonUuid ? getTaxonByUuid({ survey, taxonUuid }) : undefined
}
