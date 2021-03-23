import { LanguageCode } from '../../../language'
import { Survey, SurveyFactory } from '../../../survey'
import { User } from '../../../auth'
import { NodeDefEntityBuilder } from './nodeDefEntityBuilder'
import { CategoryBuilder } from './categoryBuilder'
import { Objects } from '../../../utils'

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
    this.categoryBuilders.forEach((categoryBuilder) => {
      const { category, items } = categoryBuilder.build()
      items.forEach((item) => {
        Objects.setInPath({
          obj: survey.indexRefData.categoryItemUuidIndex,
          value: item.uuid,
          path: [category.uuid, item.parentUuid || 'null', item.props.code || ''],
        })
        survey.indexRefData.categoryItemIndex[item.uuid] = item
      })
      survey.categories[category.uuid] = category
    })
    return survey
  }
}
