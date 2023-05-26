import { ArenaObject } from '../common'
import { AuthGroup } from '../auth'
import { Labels, LanguageCode } from '../language'
import { SRS } from '../srs'

import { NodeDef, NodeDefType } from '../nodeDef'
import { Category } from '../category'
import { Taxonomy } from '../taxonomy'
import { SurveyRefData } from './refData/refData'

export interface SurveyDependency {
  [nodeDefUuid: string]: Array<string>
}

export enum SurveyDependencyType {
  applicable = 'applicable',
  defaultValues = 'defaultValues',
  formula = 'formula',
  validations = 'validations',
}

export type SurveyDependencyGraph = {
  [key in SurveyDependencyType]: SurveyDependency
}

export interface SurveyCycle {
  dateEnd?: string
  dateStart: string
}

export interface SurveyProps {
  cycles: {
    [key: string]: SurveyCycle
  }
  defaultCycleKey?: string
  descriptions?: Labels
  languages: LanguageCode[]
  labels?: Labels
  name: string
  srs: SRS[]
  collectUri?: string
}

export interface SurveyNodeDefsIndex {
  rootDefUuid?: string
  childDefUuidPresenceByParentUuid?: { [parentUuid: string]: { [nodeDefUuid: string]: boolean }[] }
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
   * Taxonomies indexed by uuid.
   */
  taxonomies?: { [taxonomyUuid: string]: Taxonomy }
  /**
   * Refernce data cache (category items and taxa).
   */
  refData?: SurveyRefData

  nodeDefsIndex?: SurveyNodeDefsIndex
}
