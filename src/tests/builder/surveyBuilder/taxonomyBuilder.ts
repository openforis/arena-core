import { ExtraPropDefs } from '../../../extraProp'
import { Taxonomy, TaxonomyFactory, Taxon } from '../../../taxonomy'
import { TaxonBuilder } from './taxonBuilder'

export class TaxonomyBuilder {
  private name: string
  private taxonBuilders: TaxonBuilder[]
  private _extraProps: ExtraPropDefs

  constructor(name: string) {
    this.name = name
    this.taxonBuilders = []
    this._extraProps = {}
  }

  taxa(...taxonBuilders: TaxonBuilder[]): TaxonomyBuilder {
    this.taxonBuilders = [...taxonBuilders]
    return this
  }

  extraProps(extraPropsDef: ExtraPropDefs): TaxonomyBuilder {
    this._extraProps = extraPropsDef
    return this
  }

  build(): { taxonomy: Taxonomy; taxa: Taxon[] } {
    const taxonomy = TaxonomyFactory.createInstance({ props: { name: this.name, extraPropsDefs: this._extraProps } })
    const taxa = this.taxonBuilders.flatMap((taxonBuilder) => taxonBuilder.build(taxonomy))

    return {
      taxonomy,
      taxa,
    }
  }
}
