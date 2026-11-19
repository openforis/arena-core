import { ArenaObject, ArenaDictionary } from '../common'
import { ArenaAuthGroup } from '../auth'
import { ArenaLabels, LanguageCode } from '../language'
import type { ArenaAreaOfInterestDescriptor } from '../geo'
import { ArenaSRS } from '../srs'

import { ArenaAnyNodeDef } from '../nodeDef'
import { ArenaCategory } from '../category'
import { ArenaTaxonomy } from '../taxonomy'
import { ArenaSurveyRefData } from './refData/refData'

export const defaultCycle = '0'

export interface ArenaSurveyDependency {
  [nodeDefUuid: string]: string[] | boolean
}

export enum SurveyDependencyType {
  applicable = 'applicable',
  defaultValues = 'defaultValues',
  editable = 'editable',
  enumeratingItems = 'enumeratingItems',
  fileName = 'fileName',
  formula = 'formula',
  maxCount = 'maxCount',
  minCount = 'minCount',
  parentCode = 'parentCode',
  required = 'required',
  validations = 'validations',
  visible = 'visible',
  onUpdate = 'onUpdate', // dependencies updated on every record update, stored as dictionary of booleans
}

export type ArenaSurveyDependencyGraph = {
  [key in SurveyDependencyType]: ArenaSurveyDependency
}

export interface ArenaSurveyCycle {
  dateEnd?: string
  dateStart: string
}

export enum SurveySecurityProp {
  dataEditorViewNotOwnedRecordsAllowed = 'dataEditorViewNotOwnedRecordsAllowed',
  dataAnalystViewNotOwnedRecordsAllowed = 'dataAnalystViewNotOwnedRecordsAllowed',
  visibleInMobile = 'visibleInMobile',
  allowRecordsDownloadInMobile = 'allowRecordsDownloadInMobile',
  allowRecordsUploadFromMobile = 'allowRecordsUploadFromMobile',
  allowRecordsWithErrorsUploadFromMobile = 'allowRecordsWithErrorsUploadFromMobile',
  allowRecordsMergeWithSameKeys = 'allowRecordsMergeWithSameKeys',
}

export type ArenaSurveySecurity = {
  [key in SurveySecurityProp]?: boolean
}

export const surveySecurityDefaults: ArenaSurveySecurity = {
  [SurveySecurityProp.dataEditorViewNotOwnedRecordsAllowed]: true,
  [SurveySecurityProp.dataAnalystViewNotOwnedRecordsAllowed]: true,
  [SurveySecurityProp.visibleInMobile]: true,
  [SurveySecurityProp.allowRecordsDownloadInMobile]: true,
  [SurveySecurityProp.allowRecordsUploadFromMobile]: true,
  [SurveySecurityProp.allowRecordsWithErrorsUploadFromMobile]: true,
  [SurveySecurityProp.allowRecordsMergeWithSameKeys]: true,
}

export enum SurveyDocPlace {
  header = 'header',
  footer = 'footer',
}

export const surveyDocImagePropKeys = {
  documentPlace: 'documentPlace',
  applyIf: 'applyIf',
} as const

export type ArenaSurveyDocImageProps = ArenaSurveyFileProps & {
  documentPlace?: SurveyDocPlace
  applyIf?: string
}

export type ArenaSurveyFileProps = {
  deleted?: boolean
  labels?: ArenaLabels
  name?: string
  nodeUuid?: string
  recordUuid?: string
  size?: number | null
  temporary?: boolean
  type?: string
}

export type ArenaSurveyFile = {
  uuid: string
  props: ArenaSurveyFileProps
  content?: Buffer | null
  dateCreated: string
}

export type ArenaSurveyDocImage = ArenaSurveyFile & {
  props: ArenaSurveyDocImageProps
}

export type SurveyDocOptions = {
  headerOnFirstPageOnly?: boolean // default: true
}

export interface ArenaSurveyProps {
  areasOfInterest?: ArenaAreaOfInterestDescriptor[]
  collectUri?: string
  cycles: {
    [key: string]: ArenaSurveyCycle
  }
  defaultCycleKey?: string
  descriptions?: ArenaLabels
  fieldManualLinks?: ArenaLabels
  // when true, values of attributes becoming non-applicable are kept during data entry (default: cleared)
  keepNonApplicableValues?: boolean
  labels?: ArenaLabels
  languages: LanguageCode[]
  name: string
  preloadedMapLayers?: ArenaSurveyFile[]
  preloadedMapLayersEnabled?: boolean
  security?: ArenaSurveySecurity
  srs: ArenaSRS[]
  surveyDocImages?: ArenaSurveyDocImage[]
  surveyDocOptions?: SurveyDocOptions
}

export interface ArenaSurveyNodeDefsIndex {
  rootDefUuid?: string
  childDefUuidPresenceByParentUuid?: { [parentUuid: string]: { [nodeDefUuid: string]: boolean } }
  nodeDefUuidByName?: ArenaDictionary<string>
  qualifierPresenceByUuid?: { [nodeDefUuid: string]: boolean }
}

export interface ArenaSurvey extends ArenaObject<ArenaSurveyProps> {
  authGroups: Array<ArenaAuthGroup>
  dateCreated?: string
  dateModified?: string
  datePublished?: string
  dependencyGraph?: ArenaSurveyDependencyGraph
  draft: boolean
  nodeDefs?: { [nodeDefUuid: string]: ArenaAnyNodeDef }
  ownerUuid: string
  published: boolean
  readonly id?: number
  template: boolean
  uuid: string
  /**
   * Categories indexed by uuid.
   */
  categories?: { [categoryUuid: string]: ArenaCategory }
  /**
   * Taxonomies indexed by uuid.
   */
  taxonomies?: { [taxonomyUuid: string]: ArenaTaxonomy }
  /**
   * Reference data cache (category items and taxa).
   */
  refData?: ArenaSurveyRefData

  nodeDefsIndex?: ArenaSurveyNodeDefsIndex
}
