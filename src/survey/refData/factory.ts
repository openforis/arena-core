import { ArenaSurveyRefData } from './refData'
import { ArenaFactory } from '../../common'
import { ArenaTaxon } from '../../taxonomy'
import { ArenaCategoryItem } from '../../category'
import { Objects } from '../../utils'

export type SurveyRefDataFactoryParams = {
  itemsByCategoryUuid?: { [categoryUuid: string]: ArenaCategoryItem[] }
  taxonUuidIndex?: { [taxonomyUuid: string]: { [taxonCode: string]: string } }
  taxonIndex?: { [taxonUuid: string]: ArenaTaxon }
}

export const SurveyRefDataFactory: ArenaFactory<ArenaSurveyRefData, SurveyRefDataFactoryParams> = {
  createInstance: (params: SurveyRefDataFactoryParams): ArenaSurveyRefData => {
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
    const categoryItemIndex: { [categoryItemUuid: string]: ArenaCategoryItem } = {}

    Object.entries(itemsByCategoryUuid).forEach(([categoryUuid, items]) => {
      items.forEach((item) => {
        Objects.assocPath({
          obj: categoryItemUuidIndex,
          path: [categoryUuid, item.parentUuid ?? 'null', item.props?.code ?? ''],
          value: item.uuid,
          sideEffect: true,
        })
        categoryItemIndex[item.uuid] = item
      })
    })

    return { categoryItemUuidIndex, categoryItemIndex, taxonUuidIndex, taxonIndex }
  },
}
