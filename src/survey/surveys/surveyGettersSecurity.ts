import { ArenaSurveySecurity, surveySecurityDefaults, SurveySecurityProp } from '../survey'
import type { ArenaSurveyOrSummary } from '../surveySummary'

export const getSecurity = (survey: ArenaSurveyOrSummary): ArenaSurveySecurity => ({
  ...surveySecurityDefaults,
  ...survey?.props?.security,
})

export const isSecurityPropEnabled =
  (prop: SurveySecurityProp) =>
  (survey: ArenaSurveyOrSummary): boolean =>
    !!getSecurity(survey)[prop]

export const isDataEditorViewNotOwnedRecordsAllowed = (survey: ArenaSurveyOrSummary): boolean =>
  isSecurityPropEnabled(SurveySecurityProp.dataEditorViewNotOwnedRecordsAllowed)(survey)

export const isDataAnalystViewNotOwnedRecordsAllowed = (survey: ArenaSurveyOrSummary): boolean =>
  isSecurityPropEnabled(SurveySecurityProp.dataAnalystViewNotOwnedRecordsAllowed)(survey)

export const isVisibleInMobile = (survey: ArenaSurveyOrSummary): boolean =>
  isSecurityPropEnabled(SurveySecurityProp.visibleInMobile)(survey)

export const isRecordsDownloadInMobileAllowed = (survey: ArenaSurveyOrSummary): boolean =>
  isSecurityPropEnabled(SurveySecurityProp.allowRecordsDownloadInMobile)(survey)

export const isRecordsUploadFromMobileAllowed = (survey: ArenaSurveyOrSummary): boolean =>
  isSecurityPropEnabled(SurveySecurityProp.allowRecordsUploadFromMobile)(survey)

export const isRecordsWithErrorsUploadFromMobileAllowed = (survey: ArenaSurveyOrSummary): boolean =>
  isSecurityPropEnabled(SurveySecurityProp.allowRecordsWithErrorsUploadFromMobile)(survey)

export const isRecordsMergeWithSameKeysAllowed = (survey: ArenaSurveyOrSummary): boolean =>
  isSecurityPropEnabled(SurveySecurityProp.allowRecordsMergeWithSameKeys)(survey)
