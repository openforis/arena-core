import { AppInfo } from '../app'
import { Factory } from '../common'
import { SurveyExportInfo } from './SurveyExportInfo'

export type SurveyExportInfoFactoryParams = {
  appInfo: AppInfo
  exportedByUserUuid: string
  surveyUuid: string
  surveyName: string
  includeData?: boolean
  includeResultAttributes?: boolean
  includeActivityLog?: boolean
}

export const SurveyExportInfoFactory: Factory<SurveyExportInfo, SurveyExportInfoFactoryParams> = {
  createInstance: (params: SurveyExportInfoFactoryParams): SurveyExportInfo => {
    const {
      appInfo,
      exportedByUserUuid,
      surveyUuid,
      surveyName,
      includeData,
      includeResultAttributes,
      includeActivityLog,
    } = params

    return {
      appInfo,
      dateExported: new Date(),
      exportedByUserUuid,
      surveyUuid,
      surveyName,
      includeData: includeData ?? false,
      includeResultAttributes: includeResultAttributes ?? false,
      includeActivityLog: includeActivityLog ?? false,
    }
  },
}
