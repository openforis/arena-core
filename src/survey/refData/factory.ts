import { SurveyRefData } from './refData'
import { Factory } from '../../common'
import { Taxon } from '../../taxonomy'
import { CategoryItem } from '../../category'
import { Objects } from '../../utils'

export type SurveyRefDataFactoryParams = {
  itemsByCategoryUuid?: { [categoryUuid: string]: CategoryItem[] }
  taxonUuidIndex?: { [taxonomyUuid: string]: { [taxonCode: string]: Taxon } }
  taxonIndex?: { [taxonUuid: string]: Taxon }
}

export const SurveyRefDataFactory: Factory<SurveyRefData, SurveyRefDataFactoryParams> = {
  createInstance: (params: SurveyRefDataFactoryParams): SurveyRefData => {
    const defaultParams = {
      itemsByCategoryUuid: {},
      taxonUuidIndex: {},
      taxonIndex: {},
    }
    const { itemsByCategoryUuid, taxonUuidIndex, taxonIndex } = {
      ...defaultParams,
      ...params,
    }
    const categoryItemUuidIndex: {
      [categoryUuid: string]: { [parentItemUuid: string]: { [code: string]: string } }
    } = {}
    const categoryItemIndex: { [categoryItemUuid: string]: CategoryItem } = {}

    Object.entries(itemsByCategoryUuid).forEach(([categoryUuid, items]) => {
      items.forEach((item) => {
        Objects.setInPath({
          obj: categoryItemUuidIndex,
          path: [categoryUuid, item.parentUuid || 'null', item.props?.code || ''],
          value: item.uuid,
        })
        categoryItemIndex[item.uuid] = item
      }, {})
    })

    return { categoryItemUuidIndex, categoryItemIndex, taxonUuidIndex, taxonIndex }
  },
}
