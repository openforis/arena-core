import { ArenaFactory } from '../common'
import { ArenaTaxonomy, ArenaTaxonomyProps } from './taxonomy'
import { ArenaTaxon, ArenaTaxonProps } from './taxon'
import { ArenaVernacularName } from './taxonVernacularName'

import { UUIDs } from '../utils'

export type ArenaTaxonomyFactoryParams = {
  props?: ArenaTaxonomyProps
  draft?: boolean
  published?: boolean
}

export const TaxonomyFactory: ArenaFactory<ArenaTaxonomy, ArenaTaxonomyFactoryParams> = {
  createInstance: (params: ArenaTaxonomyFactoryParams): ArenaTaxonomy => {
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
export type ArenaTaxonFactoryParams = {
  props: ArenaTaxonProps
  taxonomyUuid: string
  vernacularNames?: {
    [key: string]: ArenaVernacularName[]
  }
}

export const TaxonFactory: ArenaFactory<ArenaTaxon, ArenaTaxonFactoryParams> = {
  createInstance: (params: ArenaTaxonFactoryParams): ArenaTaxon => {
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
export type ArenaVernacularNameParams = {
  lang: string
  name: string
}

export const VernacularNameFactory: ArenaFactory<ArenaVernacularName, ArenaVernacularNameParams> = {
  createInstance: (params: ArenaVernacularNameParams): ArenaVernacularName => {
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
