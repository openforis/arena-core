import { Labels, LanguageCode } from '../language'
import { Objects, UUIDs } from '../utils'
import { DataQuery, DataQuerySummary, DataQuerySummaryProps } from './dataQuery'

const PropKeys = {
  name: 'name',
  labels: 'labels',
  descriptions: 'descriptions',
}

const Keys = {
  content: 'content',
}

const create = (params: { props?: DataQuerySummaryProps; content?: DataQuery }): DataQuerySummary => {
  const { props, content } = params ?? {}
  return { uuid: UUIDs.v4(), content, props }
}

const getUuid = (querySummary: DataQuerySummary): string => querySummary?.uuid ?? ''

const getName = (querySummary: DataQuerySummary): string => querySummary?.props?.name ?? ''

const getContent = (querySummary: DataQuerySummary): DataQuery | undefined => querySummary?.content

const getLabels = (querySummary: DataQuerySummary): Labels => querySummary?.props?.labels ?? {}

const getLabel =
  (lang: LanguageCode) =>
  (querySummary: DataQuerySummary): string =>
    getLabels(querySummary)[lang] ?? ''

const getDescriptions = (querySummary: DataQuerySummary): Labels => querySummary?.props?.descriptions ?? {}

const getDescription =
  (lang: LanguageCode) =>
  (querySummary: DataQuerySummary): string =>
    getDescriptions(querySummary)[lang] ?? ''

const assocProp =
  (prop: string, value: any) =>
  (obj: any): any =>
    Objects.assocPath({ obj, path: ['props', prop], value })

const assocName =
  (value: string) =>
  (querySummary: DataQuerySummary): DataQuerySummary =>
    assocProp(PropKeys.name, value)(querySummary)

const assocLabels =
  (value: Labels) =>
  (querySummary: DataQuerySummary): DataQuerySummary =>
    assocProp(PropKeys.labels, value)(querySummary)

const assocDescriptions =
  (value: Labels) =>
  (querySummary: DataQuerySummary): DataQuerySummary =>
    assocProp(PropKeys.descriptions, value)(querySummary)

const assocContent =
  (content: DataQuery) =>
  (querySummary: DataQuerySummary): DataQuerySummary =>
    Objects.assoc({ obj: querySummary, prop: Keys.content, value: content })

export const DataQuerySummaries = {
  // create
  create,
  // read
  getUuid,
  getName,
  getContent,
  getLabels,
  getLabel,
  getDescriptions,
  getDescription,
  // update
  assocName,
  assocLabels,
  assocDescriptions,
  assocContent,
}
