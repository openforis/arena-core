import { ArenaObject, Dictionary } from '../common'
import { AuthGroup } from '../auth'
import { Labels, LanguageCode } from '../language'
import { SRS } from '../srs'

import { NodeDef, NodeDefType } from '../nodeDef'
import { Category } from '../category'
import { Taxonomy } from '../taxonomy'
import { SurveyRefData } from './refData/refData'

export const defaultCycle = '0'

export interface SurveyDependency {
  [nodeDefUuid: string]: string[] | boolean
}

export enum SurveyDependencyType {
  applicable = 'applicable',
  defaultValues = 'defaultValues',
  fileName = 'fileName',
  formula = 'formula',
  maxCount = 'maxCount',
  minCount = 'minCount',
  validations = 'validations',
  onUpdate = 'onUpdate', // dependencies updated on every record update, stored as dictionary of booleans
}

export type SurveyDependencyGraph = {
  [key in SurveyDependencyType]: SurveyDependency
}

export interface SurveyCycle {
  dateEnd?: string
  dateStart: string
}

export enum SurveySecurityProp {
  dataEditorViewNotOwnedRecordsAllowed = 'dataEditorViewNotOwnedRecordsAllowed',
  visibleInMobile = 'visibleInMobile',
  allowRecordsDownloadInMobile = 'allowRecordsDownloadInMobile',
  allowRecordsUploadFromMobile = 'allowRecordsUploadFromMobile',
  allowRecordsWithErrorsUploadFromMobile = 'allowRecordsWithErrorsUploadFromMobile',
}

export type SurveySecurity = {
  [key in SurveySecurityProp]?: boolean
}

export const surveySecurityDefaults: SurveySecurity = {
  [SurveySecurityProp.dataEditorViewNotOwnedRecordsAllowed]: true,
  [SurveySecurityProp.visibleInMobile]: true,
  [SurveySecurityProp.allowRecordsDownloadInMobile]: true,
  [SurveySecurityProp.allowRecordsUploadFromMobile]: true,
  [SurveySecurityProp.allowRecordsWithErrorsUploadFromMobile]: true,
}

export interface SurveyProps {
  collectUri?: string
  cycles: {
    [key: string]: SurveyCycle
  }
  defaultCycleKey?: string
  descriptions?: Labels
  fieldManualLinks?: Labels
  labels?: Labels
  languages: LanguageCode[]
  name: string
  security?: SurveySecurity
  srs: SRS[]
}

export interface SurveyNodeDefsIndex {
  rootDefUuid?: string
  childDefUuidPresenceByParentUuid?: { [parentUuid: string]: { [nodeDefUuid: string]: boolean } }
  nodeDefUuidByName?: Dictionary<string>
}

export interface Survey extends ArenaObject<SurveyProps> {
  authGroups: Array<AuthGroup>
  dateCreated?: string
  dateModified?: string
  datePublished?: string
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
   * Reference data cache (category items and taxa).
   */
  refData?: SurveyRefData

  nodeDefsIndex?: SurveyNodeDefsIndex
}
