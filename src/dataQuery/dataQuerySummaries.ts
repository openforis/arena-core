import { ArenaLabels, LanguageCode } from '../language'
import { getLabelOrDefault } from '../language/labels'
import { Objects, UUIDs } from '../utils'
import { ArenaDataQuery, ArenaDataQuerySummary, ArenaDataQuerySummaryProps } from './dataQuery'

const PropKeys = {
  name: 'name',
  labels: 'labels',
  descriptions: 'descriptions',
}

const Keys = {
  content: 'content',
}

const create = (params: { props?: ArenaDataQuerySummaryProps; content?: ArenaDataQuery }): ArenaDataQuerySummary => {
  const { props, content } = params ?? {}
  return { uuid: UUIDs.v4(), content, props }
}

const getUuid = (querySummary: ArenaDataQuerySummary): string => querySummary?.uuid ?? ''

const getName = (querySummary: ArenaDataQuerySummary): string => querySummary?.props?.name ?? ''

const getContent = (querySummary: ArenaDataQuerySummary): ArenaDataQuery | undefined => querySummary?.content

const getLabels = (querySummary: ArenaDataQuerySummary): ArenaLabels => querySummary?.props?.labels ?? {}

const getLabel =
  (lang: LanguageCode) =>
  (querySummary: ArenaDataQuerySummary): string =>
    getLabelOrDefault(getLabels(querySummary), lang)

const getDescriptions = (querySummary: ArenaDataQuerySummary): ArenaLabels => querySummary?.props?.descriptions ?? {}

const getDescription =
  (lang: LanguageCode) =>
  (querySummary: ArenaDataQuerySummary): string =>
    getLabelOrDefault(getDescriptions(querySummary), lang)

const assocProp =
  (prop: string, value: any) =>
  (obj: any): any =>
    Objects.assocPath({ obj, path: ['props', prop], value })

const assocName =
  (value: string) =>
  (querySummary: ArenaDataQuerySummary): ArenaDataQuerySummary =>
    assocProp(PropKeys.name, value)(querySummary)

const assocLabels =
  (value: ArenaLabels) =>
  (querySummary: ArenaDataQuerySummary): ArenaDataQuerySummary =>
    assocProp(PropKeys.labels, value)(querySummary)

const assocDescriptions =
  (value: ArenaLabels) =>
  (querySummary: ArenaDataQuerySummary): ArenaDataQuerySummary =>
    assocProp(PropKeys.descriptions, value)(querySummary)

const assocContent =
  (content: ArenaDataQuery) =>
  (querySummary: ArenaDataQuerySummary): ArenaDataQuerySummary =>
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
