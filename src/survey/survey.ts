import { ArenaObject } from 'src/common'
import { AuthGroup } from 'src/auth'
import { Labels, LanguageCode } from 'src/language'
import { SRS } from 'src/srs'

import { NodeDef, NodeDefType } from '../nodeDef'
import { Category, CategoryItem } from '../category'
import { Taxon } from '../taxonomy'

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

export interface SurveyRefData {
  categoryItemUuidIndex: { [categoryUuid: string]: { [parentItemUuid: string]: { [code: string]: string } } }
  categoryItemIndex: { [categoryItemUuid: string]: CategoryItem }
  taxonUuidIndex: { [taxonomyUuid: string]: { [taxonCode: string]: Taxon } }
  taxonIndex: { [taxonUuid: string]: Taxon }
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
  uuid: string

  categories?: { [categoryUuid: string]: Category }
  refData?: SurveyRefData
}
