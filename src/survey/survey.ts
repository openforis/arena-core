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
  applicable,
  defaultValues,
  formula,
  validations,
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
}

// export class Survey implements SurveyI {
//   authGroups = []
//   draft = false
//   ownerUuid = ''
//   published = false
//   template = false
//   props = {} as SurveyProps
//   uuid = ''

//   constructor(s: SurveyI) {
//     Object.assign(this, s)
//   }
// }
