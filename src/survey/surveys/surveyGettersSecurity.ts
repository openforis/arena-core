import { ArenaSurvey, ArenaSurveySecurity, surveySecurityDefaults, SurveySecurityProp } from '../survey'
import type { ArenaSurveySummary } from '../surveySummary'

export const getSecurity = (survey: ArenaSurvey | ArenaSurveySummary): ArenaSurveySecurity => ({
  ...surveySecurityDefaults,
  ...survey?.props?.security,
})

export const isSecurityPropEnabled =
  (prop: SurveySecurityProp) =>
  (survey: ArenaSurvey | ArenaSurveySummary): boolean =>
    !!getSecurity(survey)[prop]

export const isDataEditorViewNotOwnedRecordsAllowed = (survey: ArenaSurvey | ArenaSurveySummary): boolean =>
  isSecurityPropEnabled(SurveySecurityProp.dataEditorViewNotOwnedRecordsAllowed)(survey)

export const isDataAnalystViewNotOwnedRecordsAllowed = (survey: ArenaSurvey | ArenaSurveySummary): boolean =>
  isSecurityPropEnabled(SurveySecurityProp.dataAnalystViewNotOwnedRecordsAllowed)(survey)

export const isVisibleInMobile = (survey: ArenaSurvey | ArenaSurveySummary): boolean =>
  isSecurityPropEnabled(SurveySecurityProp.visibleInMobile)(survey)

export const isRecordsDownloadInMobileAllowed = (survey: ArenaSurvey | ArenaSurveySummary): boolean =>
  isSecurityPropEnabled(SurveySecurityProp.allowRecordsDownloadInMobile)(survey)

export const isRecordsUploadFromMobileAllowed = (survey: ArenaSurvey | ArenaSurveySummary): boolean =>
  isSecurityPropEnabled(SurveySecurityProp.allowRecordsUploadFromMobile)(survey)

export const isRecordsWithErrorsUploadFromMobileAllowed = (survey: ArenaSurvey | ArenaSurveySummary): boolean =>
  isSecurityPropEnabled(SurveySecurityProp.allowRecordsWithErrorsUploadFromMobile)(survey)

export const isRecordsMergeWithSameKeysAllowed = (survey: ArenaSurvey | ArenaSurveySummary): boolean =>
  isSecurityPropEnabled(SurveySecurityProp.allowRecordsMergeWithSameKeys)(survey)
