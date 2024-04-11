import { Category } from '../../category'
import { LanguageCode } from '../../language'
import { SRS, SRSIndex } from '../../srs'
import { Taxonomy } from '../../taxonomy'
import { Arrays, Objects } from '../../utils'
import { Survey } from '../survey'

export const getName = (survey: Survey): string => survey.props.name

export const getLanguages = (survey: Survey): LanguageCode[] => survey.props.languages

export const getDefaultLanguage = (survey: Survey): LanguageCode => getLanguages(survey)[0]

export const getLabel =
  (langCode?: LanguageCode) =>
  (survey: Survey): string | undefined => {
    const languageCode = langCode ?? getDefaultLanguage(survey)
    return survey.props.labels?.[languageCode]
  }

export const getLabelOrName =
  (langCode?: LanguageCode) =>
  (survey: Survey): string => {
    const label = getLabel(langCode)(survey)
    return label ?? getName(survey)
  }

export const getCategoryByName = (params: { survey: Survey; categoryName: string }): Category | undefined => {
  const { survey, categoryName } = params
  return survey.categories
    ? Object.values(survey.categories).find((category) => category.props.name === categoryName)
    : undefined
}

export const getCategoryByUuid = (params: { survey: Survey; categoryUuid: string }): Category | undefined => {
  const { survey, categoryUuid } = params
  return survey.categories?.[categoryUuid]
}

export const getTaxonomyByName = (params: { survey: Survey; taxonomyName: string }): Taxonomy | undefined => {
  const { survey, taxonomyName } = params
  return survey.taxonomies
    ? Object.values(survey.taxonomies).find((taxonomy) => taxonomy.props.name === taxonomyName)
    : undefined
}

export const getTaxonomyByUuid = (params: { survey: Survey; taxonomyUuid: string }): Taxonomy | undefined => {
  const { survey, taxonomyUuid } = params
  return survey.taxonomies?.[taxonomyUuid]
}

export const getCycleKeys = (survey: Survey): string[] => {
  const cycles = survey.props?.cycles ?? {}
  return Object.keys(cycles)
}

export const getLastCycleKey = (survey: Survey): string => Arrays.last(getCycleKeys(survey)) as string

export const getDefaultCycleKey = (survey: Survey) => {
  const defaultCycleKey = survey.props?.defaultCycleKey
  return Objects.isEmpty(defaultCycleKey) ? getLastCycleKey(survey) : defaultCycleKey
}

export const getSRSs = (survey: Survey): SRS[] =>
  survey.props?.srs ??
  // backwards compatibility with Arena: srs stored in info in UI
  (survey as any).info?.props?.srs ??
  []

export const getSRSIndex = (survey: Survey): SRSIndex =>
  getSRSs(survey).reduce((acc: SRSIndex, srs) => {
    acc[srs.code] = srs
    return acc
  }, {})

export const getSRSByCode =
  (code: string) =>
  (survey: Survey): SRS | undefined =>
    getSRSIndex(survey)[code]
