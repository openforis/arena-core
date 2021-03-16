import { LanguageCode } from 'src/language'
import { NodeDefType } from 'src/nodeDef'
import { SurveyFactory } from 'src/survey'
import { User } from '../../auth'
import { NodeDefAttributeBuilder } from './nodeDefAttributeBuilder'
import { NodeDefBuilder } from './nodeDefBuilder'
import { NodeDefEntityBuilder } from './nodeDefEntityBuilder'

class SurveyBuilder {
  user: User
  name: string
  label: string
  lang: LanguageCode
  rootDefBuilder: any

  constructor(user: User, rootDefBuilder: any) {
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
    survey.nodeDefs = this.rootDefBuilder.build(survey)
    return survey
  }
}

export const survey = (user: User, rootDefBuilder: NodeDefEntityBuilder) => new SurveyBuilder(user, rootDefBuilder)
export const entity = (name: string, ...childBuilders: NodeDefBuilder[]) =>
  new NodeDefEntityBuilder(name, ...childBuilders)
export const attribute = (name: string, type = NodeDefType.text) => new NodeDefAttributeBuilder(name, type)
