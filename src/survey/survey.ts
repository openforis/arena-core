import { ArenaObject } from '../common'
import { AuthGroup } from '../auth'
import { Labels, LanguageCode } from '../language'
import { SRS } from '../srs'

import { NodeDef, NodeDefType } from '../nodeDef'
import { Category } from '../category'
import { SurveyRefData } from './refData/refData'

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
  descriptions?: Labels
  languages: LanguageCode[]
  labels?: Labels
  name: string
  srs: Array<SRS>
  collectUri?: string
}

export interface Survey extends ArenaObject<SurveyProps> {
  authGroups: Array<AuthGroup>
  dateCreated?: string
  dateModified?: string
  dependencyGraph?: SurveyDependencyGraph
  draft: boolean
  nodeDefs?: { [nodeDefUuid: string]: NodeDef<NodeDefType> }
  ownerUuid: string
  published: boolean
  readonly id?: number
  template: boolean
  uuid: string
  /**
   * Categories indexed by uuid.
   */
  categories?: { [categoryUuid: string]: Category }
  /**
   * Refernce data cache (category items and taxa).
   */
  refData?: SurveyRefData
}
