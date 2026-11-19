import { LanguageCode } from '../../../language'
import { ArenaSurvey, SurveyFactory, SurveyRefDataFactory, Surveys } from '../../../survey'
import { ArenaCategory, ArenaCategoryItem } from '../../../category'
import { ArenaTaxon, ArenaTaxonomy } from '../../../taxonomy'
import { ArenaUser } from '../../../auth'
import { NodeDefEntityBuilder } from './nodeDefEntityBuilder'
import { CategoryBuilder } from './categoryBuilder'
import { TaxonomyBuilder } from './taxonomyBuilder'

export class SurveyBuilder {
  private readonly user: ArenaUser
  private readonly name: string
  private readonly label: string
  private readonly lang: LanguageCode
  private readonly rootDefBuilder: NodeDefEntityBuilder
  private categoryBuilders: CategoryBuilder[]
  private taxonomyBuilders: TaxonomyBuilder[]

  constructor(user: ArenaUser, rootDefBuilder: NodeDefEntityBuilder) {
    this.user = user
    this.name = `do_not_use__test_${Date.now()}`
    this.label = 'DO NOT USE! Test'
    this.lang = LanguageCode.en
    this.rootDefBuilder = rootDefBuilder
    this.categoryBuilders = []
    this.taxonomyBuilders = []
  }

  categories(...categoryBuilders: CategoryBuilder[]): this {
    this.categoryBuilders = categoryBuilders
    return this
  }

  taxonomies(...taxonomyBuilders: TaxonomyBuilder[]): this {
    this.taxonomyBuilders = taxonomyBuilders
    return this
  }

  private buildCategories(): {
    categoriesByUuid: { [categoryUuid: string]: ArenaCategory }
    itemsByCategoryUuid: { [categoryUuid: string]: ArenaCategoryItem[] }
  } {
    const categoriesByUuid: { [categoryUuid: string]: ArenaCategory } = {}
    const itemsByCategoryUuid: { [categoryUuid: string]: ArenaCategoryItem[] } = {}

    this.categoryBuilders.forEach((categoryBuilder) => {
      const { category, items } = categoryBuilder.build()
      itemsByCategoryUuid[category.uuid] = items
      categoriesByUuid[category.uuid] = category
    })
    return { categoriesByUuid, itemsByCategoryUuid }
  }

  private buildTaxonomies(): {
    taxonomiesByUuid: { [taxonomyUuid: string]: ArenaTaxonomy }
    taxonIndex: { [taxonUuid: string]: ArenaTaxon }
    taxonUuidIndex: { [taxonomyUuid: string]: { [taxonCode: string]: string } }
  } {
    const taxonomiesByUuid: { [taxonomyUuid: string]: ArenaTaxonomy } = {}
    const taxonUuidIndex: { [taxonomyUuid: string]: { [taxonCode: string]: string } } = {}
    const taxonIndex: { [taxonUuid: string]: ArenaTaxon } = {}

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

  async build(): Promise<ArenaSurvey> {
    let survey = SurveyFactory.createInstance({
      name: this.name,
      ownerUuid: this.user.uuid,
      label: this.label,
      languages: [this.lang],
    })

    const { categoriesByUuid, itemsByCategoryUuid } = this.buildCategories()
    const { taxonomiesByUuid, taxonIndex, taxonUuidIndex } = this.buildTaxonomies()

    survey.categories = categoriesByUuid
    survey.taxonomies = taxonomiesByUuid

    survey.nodeDefs = this.rootDefBuilder.build({ survey })

    survey = Surveys.buildAndAssocNodeDefsIndex(survey)

    survey.refData = SurveyRefDataFactory.createInstance({ itemsByCategoryUuid, taxonIndex, taxonUuidIndex })

    survey = await Surveys.buildAndAssocDependencyGraph(survey)
    return survey
  }
}
