import { Taxonomy, TaxonomyFactory, Taxon } from '../../../taxonomy'
import { TaxonBuilder } from './taxonBuilder'

export class TaxonomyBuilder {
  private name: string
  private taxonBuilders: TaxonBuilder[]

  constructor(name: string) {
    this.name = name
    this.taxonBuilders = []
  }

  taxa(...taxonBuilders: TaxonBuilder[]): TaxonomyBuilder {
    this.taxonBuilders = [...taxonBuilders]
    return this
  }

  build(): { taxonomy: Taxonomy; taxa: Taxon[] } {
    const taxonomy = TaxonomyFactory.createInstance({ props: { name: this.name } })
    const taxa = this.taxonBuilders.flatMap((taxonBuilder) => taxonBuilder.build(taxonomy))

    return {
      taxonomy,
      taxa,
    }
  }
}
