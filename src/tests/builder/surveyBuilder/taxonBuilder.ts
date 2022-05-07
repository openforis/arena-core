import { Taxonomy, Taxon, TaxonFactory, VernacularName, VernacularNameFactory } from '../../../taxonomy'

export class TaxonBuilder {
  private code: string
  private family: string
  private genus: string
  private scientificName: string
  private extraProps: { [key: string]: any }
  private vernacularNames: { [key: string]: VernacularName[] }

  constructor(code: string, family: string, genus: string, scientificName: string) {
    this.code = code
    this.family = family
    this.genus = genus
    this.scientificName = scientificName
    this.extraProps = {}
    this.vernacularNames = {}
  }

  vernacularName(lang: string, name: string): TaxonBuilder {
    const names = this.vernacularNames[lang] || []
    names.push(VernacularNameFactory.createInstance({ lang, name }))
    this.vernacularNames[lang] = names
    return this
  }

  extra(extraProps: { [key: string]: any }): TaxonBuilder {
    this.extraProps = extraProps
    return this
  }

  build(taxonomy: Taxonomy): Taxon {
    return TaxonFactory.createInstance({
      props: {
        code: this.code,
        extra: this.extraProps,
        family: this.family,
        genus: this.genus,
        scientificName: this.scientificName,
      },
      taxonomyUuid: taxonomy.uuid,
      vernacularNames: this.vernacularNames,
    })
  }
}
