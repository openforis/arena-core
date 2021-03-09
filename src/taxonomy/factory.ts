import { v4 as uuidv4 } from 'uuid'

import { Factory } from 'src/common'
import { Taxonomy, TaxonomyProps } from './taxonomy'

export type TaxonomyFactoryParams = {
  props?: TaxonomyProps
  draft?: boolean
  published?: boolean
}

export const TaxonomyFactory: Factory<Taxonomy> = {
  createInstance: (params: TaxonomyFactoryParams): Taxonomy => {
    const defaultProps = {
      props: {},
      published: undefined,
      draft: undefined,
    }

    const { props, draft, published } = {
      ...defaultProps,
      ...params,
    }

    return {
      uuid: uuidv4(),
      props,
      draft,
      published,
    }
  },
}
