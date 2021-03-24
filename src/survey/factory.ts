import { DEFAULT_SRS } from '../srs'

import { Factory } from '../common'
import { Survey, SurveyRefData } from './survey'
import { Labels, LanguageCode } from 'src/language'
import { Objects, UUIDs } from '../utils'
import { AuthGroup, DEFAULT_AUTH_GROUPS } from '../auth/authGroup'
import { Taxon } from 'src/taxonomy'
import { CategoryItem } from 'src/category'

export type SurveyFactoryParams = {
  ownerUuid: string
  name: string
  label?: string
  languages?: LanguageCode[]
  published?: boolean
  draft?: boolean
  collectUri?: string
  descriptions?: Labels
  authGroups?: AuthGroup[]
}

const defaultProps = {
  languages: [LanguageCode.en],
  published: false,
  draft: true,
  authGroups: DEFAULT_AUTH_GROUPS,
}

export const SurveyFactory: Factory<Survey, SurveyFactoryParams> = {
  createInstance: (params: SurveyFactoryParams): Survey => {
    const { ownerUuid, name, label, languages, published, draft, collectUri, descriptions, authGroups } = {
      ...defaultProps,
      ...params,
    }

    return {
      id: undefined,
      uuid: UUIDs.v4(),
      published,
      draft,
      ownerUuid,
      authGroups,
      props: {
        name,
        languages,
        labels: label ? { [languages[0]]: label } : {},
        srs: [DEFAULT_SRS],
        cycles: {
          '0': {
            dateStart: new Date().toISOString().split('T')[0],
          },
        },
        descriptions,
        collectUri,
      },
    }
  },
}

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
          path: [categoryUuid, item.parentUuid || 'null', item?.props?.code || ''],
          value: item.uuid,
        })
        categoryItemIndex[item.uuid] = item
      }, {})
    })

    return { categoryItemUuidIndex, categoryItemIndex, taxonUuidIndex, taxonIndex }
  },
}
