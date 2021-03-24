import { LanguageCode } from '../../../language'
import { Survey, SurveyFactory, SurveyRefDataFactory } from '../../../survey'
import { Category, CategoryItem } from '../../../category'
import { User } from '../../../auth'
import { NodeDefEntityBuilder } from './nodeDefEntityBuilder'
import { CategoryBuilder } from './categoryBuilder'

export class SurveyBuilder {
  private user: User
  private name: string
  private label: string
  private lang: LanguageCode
  private rootDefBuilder: NodeDefEntityBuilder
  private categoryBuilders: CategoryBuilder[]

  constructor(user: User, rootDefBuilder: NodeDefEntityBuilder) {
    this.user = user
    this.name = `do_not_use__test_${new Date().getTime()}`
    this.label = 'DO NOT USE! Test'
    this.lang = LanguageCode.en
    this.rootDefBuilder = rootDefBuilder
    this.categoryBuilders = []
  }

  categories(...categoryBuilders: CategoryBuilder[]): SurveyBuilder {
    this.categoryBuilders = categoryBuilders
    return this
  }

  build(): Survey {
    const survey = SurveyFactory.createInstance({
      name: this.name,
      ownerUuid: this.user.uuid,
      label: this.label,
      languages: [this.lang],
    })
    survey.nodeDefs = this.rootDefBuilder.build({ survey })
    const categoriesByUuid: { [categoryUuid: string]: Category } = {}
    const itemsByCategoryUuid: { [categoryUuid: string]: CategoryItem[] } = {}

    this.categoryBuilders.forEach((categoryBuilder) => {
      const { category, items } = categoryBuilder.build()
      itemsByCategoryUuid[category.uuid] = items
      categoriesByUuid[category.uuid] = category
    })
    survey.refData = SurveyRefDataFactory.createInstance({ itemsByCategoryUuid })
    survey.categories = categoriesByUuid
    return survey
  }
}
