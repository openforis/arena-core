import { Factory } from '../common'
import { SurveyDocImages } from './surveyDocImages'
import { SurveyDocImage, SurveyDocPlace } from './survey'
import { SurveyFileFactory, SurveyFileFactoryParams, SurveyFileType } from './surveyFileFactory'

export type SurveyDocImageFactoryParams = SurveyFileFactoryParams & {
  documentPlace?: SurveyDocPlace | null
  applyIf?: string
}

export const SurveyDocImageFactory: Factory<SurveyDocImage, SurveyDocImageFactoryParams> = {
  createInstance: (params: SurveyDocImageFactoryParams = {}): SurveyDocImage => {
    const { documentPlace, applyIf } = params

    let image = SurveyFileFactory.createInstance({ ...params, type: SurveyFileType.surveyDocImage }) as SurveyDocImage

    if (documentPlace) image = SurveyDocImages.assocDocumentPlace(documentPlace)(image)
    if (applyIf) image = SurveyDocImages.assocApplyIf(applyIf)(image)

    return image
  },
}
