import { SurveyRefData } from './refData'
import { Factory } from '../../common'
import { Taxon } from '../../taxonomy'
import { CategoryItem } from '../../category'
import { Objects } from '../../utils'
import { SRS } from '../../srs'

export type SurveyRefDataFactoryParams = {
  itemsByCategoryUuid?: { [categoryUuid: string]: CategoryItem[] }
  taxonUuidIndex?: { [taxonomyUuid: string]: { [taxonCode: string]: string } }
  taxonIndex?: { [taxonUuid: string]: Taxon }
  srsIndex?: { [srsCode: string]: SRS }
}

export const SurveyRefDataFactory: Factory<SurveyRefData, SurveyRefDataFactoryParams> = {
  createInstance: (params: SurveyRefDataFactoryParams): SurveyRefData => {
    const defaultParams = {
      itemsByCategoryUuid: {},
      taxonUuidIndex: {},
      taxonIndex: {},
    }
    const { itemsByCategoryUuid, taxonUuidIndex, taxonIndex }: SurveyRefDataFactoryParams = {
      ...defaultParams,
      ...params,
    }
    const categoryItemUuidIndex: {
      [categoryUuid: string]: { [parentItemUuid: string]: { [code: string]: string } }
    } = {}
    const categoryItemIndex: { [categoryItemUuid: string]: CategoryItem } = {}

    Object.entries(itemsByCategoryUuid).forEach(([categoryUuid, items]) => {
      items.forEach((item) => {
        Objects.assocPath({
          obj: categoryItemUuidIndex,
          path: [categoryUuid, item.parentUuid || 'null', item.props?.code || ''],
          value: item.uuid,
          sideEffect: true,
        })
        categoryItemIndex[item.uuid] = item
      }, {})
    })

    return { categoryItemUuidIndex, categoryItemIndex, taxonUuidIndex, taxonIndex }
  },
}
