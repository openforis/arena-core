import { Survey, SurveySecurity, surveySecurityDefaults, SurveySecurityProp } from '../survey'

export const getSecurity = (survey: Survey): SurveySecurity => ({
  ...surveySecurityDefaults,
  ...(survey?.props?.security ?? {}),
})

export const isSecurityPropEnabled =
  (prop: SurveySecurityProp) =>
  (survey: Survey): boolean =>
    !!getSecurity(survey)[prop]

export const isDataEditorViewNotOwnedRecordsAllowed = (survey: Survey): boolean =>
  isSecurityPropEnabled(SurveySecurityProp.dataEditorViewNotOwnedRecordsAllowed)(survey)

export const isVisibleInMobile = (survey: Survey): boolean =>
  isSecurityPropEnabled(SurveySecurityProp.visibleInMobile)(survey)

export const isRecordsDownloadInMobileAllowed = (survey: Survey): boolean =>
  isSecurityPropEnabled(SurveySecurityProp.allowRecordsDownloadInMobile)(survey)

export const isRecordsUploadFromMobileAllowed = (survey: Survey): boolean =>
  isSecurityPropEnabled(SurveySecurityProp.allowRecordsUploadFromMobile)(survey)

export const isRecordsWithErrorsUploadFromMobileAllowed = (survey: Survey): boolean =>
  isSecurityPropEnabled(SurveySecurityProp.allowRecordsWithErrorsUploadFromMobile)(survey)
