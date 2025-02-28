import { Survey, SurveySecurity, SurveySecurityProp } from '../survey'

export const getSecurity = (survey: Survey): SurveySecurity | undefined => survey?.props?.security

export const isDataEditorViewNotOwnedRecordsAllowed = (survey: Survey): boolean =>
  !!getSecurity(survey)?.[SurveySecurityProp.dataEditorViewNotOwnedRecordsAllowed]

export const isVisibleInMobile = (survey: Survey): boolean =>
  !!getSecurity(survey)?.[SurveySecurityProp.visibleInMobile]

export const isRecordsDownloadInMobileAllowed = (survey: Survey): boolean =>
  !!getSecurity(survey)?.[SurveySecurityProp.allowRecordsDownloadInMobile]

export const isRecordsUploadFromMobileAllowed = (survey: Survey): boolean =>
  !!getSecurity(survey)?.[SurveySecurityProp.allowRecordsUploadFromMobile]
