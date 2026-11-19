import { ArenaExtraPropDefs } from '../../../extraProp'
import { ArenaTaxonomy, TaxonomyFactory, ArenaTaxon } from '../../../taxonomy'
import { TaxonBuilder } from './taxonBuilder'

export class TaxonomyBuilder {
  private readonly name: string
  private taxonBuilders: TaxonBuilder[]
  private _extraProps: ArenaExtraPropDefs

  constructor(name: string) {
    this.name = name
    this.taxonBuilders = []
    this._extraProps = {}
  }

  taxa(...taxonBuilders: TaxonBuilder[]): this {
    this.taxonBuilders = [...taxonBuilders]
    return this
  }

  extraProps(extraPropsDef: ArenaExtraPropDefs): this {
    this._extraProps = extraPropsDef
    return this
  }

  build(): { taxonomy: ArenaTaxonomy; taxa: ArenaTaxon[] } {
    const taxonomy = TaxonomyFactory.createInstance({ props: { name: this.name, extraPropsDefs: this._extraProps } })
    const taxa = this.taxonBuilders.flatMap((taxonBuilder) => taxonBuilder.build(taxonomy))

    return {
      taxonomy,
      taxa,
    }
  }
}
