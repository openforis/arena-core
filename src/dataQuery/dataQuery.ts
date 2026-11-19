import { ArenaLabels } from '../language'

export enum DataQueryMode {
  raw = 'raw',
  aggregate = 'aggregate',
}

export interface ArenaDataQuery {
  mode: DataQueryMode
  filter?: string
  sort?: string
  entityDefUuid?: string
  attributeDefUuids?: string[]
  dimensions?: string[]
  measures?: string[]
  filterRecordUuids?: string[]
}

export interface ArenaDataQuerySummaryProps {
  name?: string
  labels?: ArenaLabels
  descriptions?: ArenaLabels
}

export interface ArenaDataQuerySummary {
  content?: ArenaDataQuery
  dateCreated?: string
  dateModified?: string
  id?: number
  props?: ArenaDataQuerySummaryProps
  uuid?: string
}
