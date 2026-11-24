import { AuthGroupName, ArenaUserAuthGroup } from '../../auth'
import { ArenaCategory } from '../../category'
import type { ArenaAreaOfInterestDescriptor } from '../../geo'
import { LanguageCode } from '../../language'
import { getLabelOrDefault } from '../../language/labels'
import { ArenaSRS, ArenaSRSIndex } from '../../srs'
import { ArenaTaxonomy } from '../../taxonomy'
import { Arrays, Objects } from '../../utils'
import { ArenaSurvey } from '../survey'
import type { ArenaSurveySummary } from '../surveySummary'

export const getName = (survey: ArenaSurvey | ArenaSurveySummary): string => survey.props.name

export const getLanguages = (survey: ArenaSurvey | ArenaSurveySummary): LanguageCode[] => survey.props.languages

export const getDefaultLanguage = (survey: ArenaSurvey | ArenaSurveySummary): LanguageCode => getLanguages(survey)[0]

const getMultilangPropValue =
  (prop: 'labels' | 'descriptions' | 'fieldManualLinks') =>
  (langCode?: LanguageCode) =>
  (survey: ArenaSurvey | ArenaSurveySummary): string | undefined => {
    const languageCode = langCode ?? getDefaultLanguage(survey)
    return survey.props[prop]?.[languageCode]
  }
export const getLabel = getMultilangPropValue('labels')
export const getDescription = getMultilangPropValue('descriptions')
export const getFieldManualLink = getMultilangPropValue('fieldManualLinks')

/**
 * Returns the survey label in the specified language (the default language if not specified), or the survey name
 * when the label is missing or empty.
 */
export const getLabelOrName =
  (langCode?: LanguageCode) =>
  (survey: ArenaSurvey | ArenaSurveySummary): string =>
    getLabelOrDefault(survey.props.labels, langCode ?? getDefaultLanguage(survey), getName(survey))

export const getCategoryByName = (params: { survey: ArenaSurvey; categoryName: string }): ArenaCategory | undefined => {
  const { survey, categoryName } = params
  return survey.categories
    ? Object.values(survey.categories).find((category) => category.props.name === categoryName)
    : undefined
}

export const getCategoryByUuid = (params: { survey: ArenaSurvey; categoryUuid: string }): ArenaCategory | undefined => {
  const { survey, categoryUuid } = params
  return survey.categories?.[categoryUuid]
}

export const getTaxonomyByName = (params: { survey: ArenaSurvey; taxonomyName: string }): ArenaTaxonomy | undefined => {
  const { survey, taxonomyName } = params
  return survey.taxonomies
    ? Object.values(survey.taxonomies).find((taxonomy) => taxonomy.props.name === taxonomyName)
    : undefined
}

export const getTaxonomyByUuid = (params: { survey: ArenaSurvey; taxonomyUuid: string }): ArenaTaxonomy | undefined => {
  const { survey, taxonomyUuid } = params
  return survey.taxonomies?.[taxonomyUuid]
}

export const getCycleKeys = (survey: ArenaSurvey | ArenaSurveySummary): string[] => {
  const cycles = survey.props?.cycles ?? {}
  return Object.keys(cycles)
}

export const getLastCycleKey = (survey: ArenaSurvey | ArenaSurveySummary): string =>
  Arrays.last(getCycleKeys(survey)) as string

export const isKeepNonApplicableValues = (survey: ArenaSurvey | ArenaSurveySummary): boolean =>
  survey?.props?.keepNonApplicableValues === true

export const getDefaultCycleKey = (survey: ArenaSurvey | ArenaSurveySummary) => {
  const defaultCycleKey = survey.props?.defaultCycleKey
  const lastCycleKey = getLastCycleKey(survey)
  return Objects.isEmpty(defaultCycleKey) || Number(defaultCycleKey) > Number(lastCycleKey)
    ? lastCycleKey
    : defaultCycleKey
}

export const getSRSs = (survey: ArenaSurvey | ArenaSurveySummary): ArenaSRS[] =>
  survey.props?.srs ??
  // backwards compatibility with Arena: srs stored in info in UI
  (survey as any).info?.props?.srs ??
  []

export const getSRSIndex = (survey: ArenaSurvey | ArenaSurveySummary): ArenaSRSIndex =>
  getSRSs(survey).reduce((acc: ArenaSRSIndex, srs) => {
    acc[srs.code] = srs
    return acc
  }, {})

export const getSRSByCode =
  (code: string) =>
  (survey: ArenaSurvey | ArenaSurveySummary): ArenaSRS | undefined =>
    getSRSIndex(survey)[code]

export const getAreasOfInterest = (survey: ArenaSurvey | ArenaSurveySummary): ArenaAreaOfInterestDescriptor[] =>
  survey?.props?.areasOfInterest ??
  // backwards compatibility with Arena: survey info props stored in info
  (survey as any)?.info?.props?.areasOfInterest ??
  []

export const getAreaOfInterestByName = (params: {
  survey: ArenaSurvey | ArenaSurveySummary
  name: string
}): ArenaAreaOfInterestDescriptor | undefined =>
  getAreasOfInterest(params.survey).find((areaOfInterest) => areaOfInterest.name === params.name)

export const getAuthGroups = (survey: ArenaSurvey): ArenaUserAuthGroup[] => survey?.authGroups ?? []

export const getAuthGroupAdmin = (survey: ArenaSurvey): ArenaUserAuthGroup | undefined =>
  getAuthGroups(survey).find((authGroup) => authGroup.name === AuthGroupName.surveyAdmin)
