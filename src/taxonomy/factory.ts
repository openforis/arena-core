import { Factory } from 'src/common'
import { Taxonomy, TaxonomyProps } from './taxonomy'
import { Taxon, TaxonProps } from './taxon'
import { VernacularName } from './taxonVernacularName'
import { LanguageCode } from 'src/language'

import { UUIDs } from '../utils'

export type TaxonomyFactoryParams = {
  props?: TaxonomyProps
  draft?: boolean
  published?: boolean
}

export const TaxonomyFactory: Factory<Taxonomy, TaxonomyFactoryParams> = {
  createInstance: (params: TaxonomyFactoryParams): Taxonomy => {
    const defaultProps = {
      props: {},
      published: false,
      draft: true,
    }

    const { props, draft, published } = {
      ...defaultProps,
      ...params,
    }

    return {
      uuid: UUIDs.v4(),
      props,
      draft,
      published,
    }
  },
}

// Taxon
export type TaxonFactoryParams = {
  props: TaxonProps
  taxonomyUuid: string
  vernacularNames?: {
    [key: string]: VernacularName[]
  }
}

export const TaxonFactory: Factory<Taxon, TaxonFactoryParams> = {
  createInstance: (params: TaxonFactoryParams): Taxon => {
    const defaultProps = {
      props: {},
      vernacularNames: {},
    }

    const { props, taxonomyUuid, vernacularNames } = {
      ...defaultProps,
      ...params,
    }

    return {
      uuid: UUIDs.v4(),
      props,
      taxonomyUuid,
      vernacularNames,
    }
  },
}

// VernacularNameFactory
export type VernacularNameParams = {
  lang: LanguageCode
  name: string
}

export const VernacularNameFactory: Factory<VernacularName, VernacularNameParams> = {
  createInstance: (params: VernacularNameParams): VernacularName => {
    const { lang, name } = params

    return {
      uuid: UUIDs.v4(),
      props: {
        lang,
        name,
      },
    }
  },
}
