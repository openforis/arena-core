import { v4 as uuidv4 } from 'uuid'

import { Factory } from 'src/common'
import { Taxon, TaxonProps } from './taxon'
import { VernacularName } from '../taxonVernacularName'

export type TaxonFactoryParams = {
  props: TaxonProps
  taxonomyUuid: string
  vernacularNames?: {
    [key: string]: VernacularName[]
  }
}

// ===== CREATE
export const TaxonFactory: Factory<Taxon> = {
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
      uuid: uuidv4(),
      taxonomyUuid,
      props,
      vernacularNames,
    }
  },
}
