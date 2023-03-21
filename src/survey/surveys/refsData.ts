import { Survey } from '../survey'
import { CategoryItem } from '../../category'
import { Taxon } from '../../taxonomy'
import { NodeDefs, NodeDefTaxon } from '../../nodeDef'

export const getCategoryItemByUuid = (params: { survey: Survey; itemUuid: string }): CategoryItem | undefined => {
  const { survey, itemUuid } = params
  return survey.refData?.categoryItemIndex[itemUuid]
}

const nullParentItemUuid = 'null'

export const getCategoryItems = (params: {
  survey: Survey
  categoryUuid: string
  parentItemUuid?: string
}): CategoryItem[] => {
  const { survey, categoryUuid, parentItemUuid = nullParentItemUuid } = params
  const itemUuids: string[] = Object.values(
    survey.refData?.categoryItemUuidIndex?.[categoryUuid]?.[parentItemUuid] || {}
  )
  const items = itemUuids.reduce((acc: CategoryItem[], itemUuid) => {
    const item = getCategoryItemByUuid({ survey, itemUuid })
    if (item) acc.push(item)
    return acc
  }, [])
  return items.sort((item1, item2) => (item1.index || 0) - (item2.index || 0))
}

export const getCategoryItemUuidByCode = (params: {
  survey: Survey
  categoryUuid: string
  parentItemUuid: string | undefined
  code: string
}): string | undefined => {
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
        ? getCategoryItemUuidByCode({ survey, categoryUuid, parentItemUuid: currentParentUuid, code })
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

export const getTaxonVernacularNameUuid = (params: {
  survey: Survey
  taxonomyUuid: string
  taxonCode: string
  vernacularName: string
}): string | undefined => {
  const { survey, taxonomyUuid, taxonCode, vernacularName } = params
  const taxon = getTaxonByCode({ survey, taxonomyUuid, taxonCode })
  const vernacularNameObj = Object.values(taxon?.vernacularNames || {})
    .flat()
    .find((vernNameObj) => vernNameObj.props.name === vernacularName)
  return vernacularNameObj?.uuid
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
