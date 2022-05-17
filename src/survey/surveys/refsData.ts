import { Survey } from '../survey'
import { CategoryItem } from '../../category'
import { Taxon } from '../../taxonomy'
import { NodeDefs, NodeDefTaxon } from '../../nodeDef'

export const getCategoryItemByUuid = (params: { survey: Survey; itemUuid: string }): CategoryItem | undefined => {
  const { survey, itemUuid } = params
  return survey.refData?.categoryItemIndex[itemUuid]
}

const nullParentItemUuid = 'null'

export const getCategoryItemByCode = (params: {
  survey: Survey
  categoryUuid: string
  parentItemUuid: string | undefined
  code: string
}) => {
  const { survey, categoryUuid, parentItemUuid = nullParentItemUuid, code } = params
  return survey.refData?.categoryItemUuidIndex?.[categoryUuid]?.[parentItemUuid]?.[code]
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
        ? getCategoryItemByCode({ survey, categoryUuid, parentItemUuid: currentParentUuid, code })
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

export const includesTaxonVernacularName = (params: {
  survey: Survey
  nodeDef: NodeDefTaxon
  taxonCode: string
  vernacularNameUuid: string
}): boolean => {
  const { survey, nodeDef, taxonCode, vernacularNameUuid } = params
  const taxonomyUuid = NodeDefs.getTaxonomyUuid(nodeDef)
  if (!taxonomyUuid) return false

  const taxon = getTaxonByCode({ survey, taxonomyUuid, taxonCode })
  const vernacularNamesByLang = taxon?.vernacularNames || {}

  return Object.values(vernacularNamesByLang).some((vernacularNames) =>
    vernacularNames.some((vernacularName) => vernacularName.uuid === vernacularNameUuid)
  )
}
