import { LanguageCode } from '../../../language'
import { SurveyFactory } from '../../../survey'
import { User } from '../../../auth'
import { NodeDefEntityBuilder } from './nodeDefEntityBuilder'

export class SurveyBuilder {
  private user: User
  private name: string
  private label: string
  private lang: LanguageCode
  private rootDefBuilder: NodeDefEntityBuilder

  constructor(user: User, rootDefBuilder: NodeDefEntityBuilder) {
    this.user = user
    this.name = `do_not_use__test_${new Date().getTime()}`
    this.label = 'DO NOT USE! Test'
    this.lang = LanguageCode.en
    this.rootDefBuilder = rootDefBuilder
  }

  build() {
    const survey = SurveyFactory.createInstance({
      name: this.name,
      ownerUuid: this.user.uuid,
      label: this.label,
      languages: [this.lang],
    })
    survey.nodeDefs = this.rootDefBuilder.build({ survey })
    return survey
  }
}
