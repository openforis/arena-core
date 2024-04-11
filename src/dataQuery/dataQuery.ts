import { Labels } from '../language'

export enum DataQueryMode {
  raw = 'raw',
  aggregate = 'aggregate',
}

export interface DataQuery {
  mode: DataQueryMode
  filter?: string
  sort?: string
  entityDefUuid?: string
  attributeDefUuids?: string[]
  dimensions?: string[]
  measures?: string[]
  filterRecordUuids?: string[]
}

export interface DataQuerySummaryProps {
  name?: string
  labels?: Labels
  descriptions?: Labels
}

export interface DataQuerySummary {
  content?: DataQuery
  dateCreated?: string
  dateModified?: string
  id?: number
  props?: DataQuerySummaryProps
  uuid?: string
}
