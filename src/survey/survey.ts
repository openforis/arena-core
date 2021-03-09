import { ArenaObject } from 'src/common'
import { AuthGroup } from 'src/auth'
import { Labels, LanguageCode } from 'src/language'
import { SRS } from 'src/srs'

import { NodeDef, NodeDefType } from '../nodeDef'

export interface SurveyDependency {
  [nodeDefUuid: string]: Array<string>
}

export interface SurveyDependencyGraph {
  defaultValues: SurveyDependency
  applicable: SurveyDependency
  validations: SurveyDependency
  formula: SurveyDependency
}

export interface SurveyCycle {
  dateEnd?: string
  dateStart: string
}

export interface SurveyProps {
  cycles: {
    [key: string]: SurveyCycle
  }
  descriptions?: Labels[]
  languages: Array<LanguageCode>
  labels?: Labels | {}
  name: string
  srs: Array<SRS>
  collectUri?: string
}

export interface Survey extends ArenaObject<SurveyProps> {
  dependencyGraph?: SurveyDependencyGraph
  nodeDefs?: {
    [nodeDefUuid: string]: NodeDef<NodeDefType>
  }
  authGroups: Array<AuthGroup>
  dateCreated?: string
  dateModified?: string
  draft: boolean
  readonly id: string
  ownerUuid: string
  published: boolean
  uuid: string
}
