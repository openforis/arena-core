import { LanguageCode } from '../../../language'
import { Survey, SurveyFactory, SurveyRefDataFactory } from '../../../survey'
import { Category, CategoryItem } from '../../../category'
import { Taxon, Taxonomy } from '../../../taxonomy'
import { User } from '../../../auth'
import { NodeDefEntityBuilder } from './nodeDefEntityBuilder'
import { CategoryBuilder } from './categoryBuilder'
import { TaxonomyBuilder } from './taxonomyBuilder'

export class SurveyBuilder {
  private user: User
  private name: string
  private label: string
  private lang: LanguageCode
  private rootDefBuilder: NodeDefEntityBuilder
  private categoryBuilders: CategoryBuilder[]
  private taxonomyBuilders: TaxonomyBuilder[]

  constructor(user: User, rootDefBuilder: NodeDefEntityBuilder) {
    this.user = user
    this.name = `do_not_use__test_${new Date().getTime()}`
    this.label = 'DO NOT USE! Test'
    this.lang = LanguageCode.en
    this.rootDefBuilder = rootDefBuilder
    this.categoryBuilders = []
    this.taxonomyBuilders = []
  }

  categories(...categoryBuilders: CategoryBuilder[]): SurveyBuilder {
    this.categoryBuilders = categoryBuilders
    return this
  }

  taxonomies(...taxonomyBuilders: TaxonomyBuilder[]): SurveyBuilder {
    this.taxonomyBuilders = taxonomyBuilders
    return this
  }

  private buildCategories() {
    const categoriesByUuid: { [categoryUuid: string]: Category } = {}
    const itemsByCategoryUuid: { [categoryUuid: string]: CategoryItem[] } = {}

    this.categoryBuilders.forEach((categoryBuilder) => {
      const { category, items } = categoryBuilder.build()
      itemsByCategoryUuid[category.uuid] = items
      categoriesByUuid[category.uuid] = category
    })
    return { categoriesByUuid, itemsByCategoryUuid }
  }

  private buildTaxonomies() {
    const taxonomiesByUuid: { [taxonomyUuid: string]: Taxonomy } = {}
    const taxonUuidIndex: { [taxonomyUuid: string]: { [taxonCode: string]: string } } = {}
    const taxonIndex: { [taxonUuid: string]: Taxon } = {}

    this.taxonomyBuilders.forEach((taxonomyBuilder) => {
      const { taxonomy, taxa } = taxonomyBuilder.build()

      taxonUuidIndex[taxonomy.uuid] = {}

      taxa.forEach((taxon) => {
        taxonUuidIndex[taxonomy.uuid][taxon.props.code] = taxon.uuid
        taxonIndex[taxon.uuid] = taxon
      })
      taxonomiesByUuid[taxonomy.uuid] = taxonomy
    })
    return { taxonomiesByUuid, taxonIndex, taxonUuidIndex }
  }

  build(): Survey {
    const survey = SurveyFactory.createInstance({
      name: this.name,
      ownerUuid: this.user.uuid,
      label: this.label,
      languages: [this.lang],
    })
    survey.nodeDefs = this.rootDefBuilder.build({ survey })

    const {
      categoriesByUuid,
      itemsByCategoryUuid,
    }: {
      categoriesByUuid: { [categoryUuid: string]: Category }
      itemsByCategoryUuid: { [categoryUuid: string]: CategoryItem[] }
    } = this.buildCategories()
    const {
      taxonomiesByUuid,
      taxonIndex,
      taxonUuidIndex,
    }: {
      taxonomiesByUuid: { [taxonomyUuid: string]: Taxonomy }
      taxonIndex: { [taxonUuid: string]: Taxon }
      taxonUuidIndex: { [taxonomyUuid: string]: { [taxonCode: string]: string } }
    } = this.buildTaxonomies()

    survey.categories = categoriesByUuid
    survey.taxonomies = taxonomiesByUuid
    survey.refData = SurveyRefDataFactory.createInstance({ itemsByCategoryUuid, taxonIndex, taxonUuidIndex })
    return survey
  }
}
