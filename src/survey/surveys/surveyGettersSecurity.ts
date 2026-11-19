import { ArenaSurvey, ArenaSurveySecurity, surveySecurityDefaults, SurveySecurityProp } from '../survey'

export const getSecurity = (survey: ArenaSurvey): ArenaSurveySecurity => ({
  ...surveySecurityDefaults,
  ...survey?.props?.security,
})

export const isSecurityPropEnabled =
  (prop: SurveySecurityProp) =>
  (survey: ArenaSurvey): boolean =>
    !!getSecurity(survey)[prop]

export const isDataEditorViewNotOwnedRecordsAllowed = (survey: ArenaSurvey): boolean =>
  isSecurityPropEnabled(SurveySecurityProp.dataEditorViewNotOwnedRecordsAllowed)(survey)

export const isDataAnalystViewNotOwnedRecordsAllowed = (survey: ArenaSurvey): boolean =>
  isSecurityPropEnabled(SurveySecurityProp.dataAnalystViewNotOwnedRecordsAllowed)(survey)

export const isVisibleInMobile = (survey: ArenaSurvey): boolean =>
  isSecurityPropEnabled(SurveySecurityProp.visibleInMobile)(survey)

export const isRecordsDownloadInMobileAllowed = (survey: ArenaSurvey): boolean =>
  isSecurityPropEnabled(SurveySecurityProp.allowRecordsDownloadInMobile)(survey)

export const isRecordsUploadFromMobileAllowed = (survey: ArenaSurvey): boolean =>
  isSecurityPropEnabled(SurveySecurityProp.allowRecordsUploadFromMobile)(survey)

export const isRecordsWithErrorsUploadFromMobileAllowed = (survey: ArenaSurvey): boolean =>
  isSecurityPropEnabled(SurveySecurityProp.allowRecordsWithErrorsUploadFromMobile)(survey)

export const isRecordsMergeWithSameKeysAllowed = (survey: ArenaSurvey): boolean =>
  isSecurityPropEnabled(SurveySecurityProp.allowRecordsMergeWithSameKeys)(survey)
