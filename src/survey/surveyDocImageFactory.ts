import { ArenaFactory } from '../common'
import { SurveyDocImages } from './surveyDocImages'
import { ArenaSurveyDocImage, SurveyDocPlace } from './survey'
import { SurveyFileFactory, ArenaSurveyFileFactoryParams, SurveyFileType } from './surveyFileFactory'

export type ArenaSurveyDocImageFactoryParams = ArenaSurveyFileFactoryParams & {
  documentPlace?: SurveyDocPlace | null
  applyIf?: string
}

export const SurveyDocImageFactory: ArenaFactory<ArenaSurveyDocImage, ArenaSurveyDocImageFactoryParams> = {
  createInstance: (params: ArenaSurveyDocImageFactoryParams = {}): ArenaSurveyDocImage => {
    const { documentPlace, applyIf, ...fileParams } = params

    let image = SurveyFileFactory.createInstance({
      ...fileParams,
      type: SurveyFileType.surveyDocImage,
    }) as ArenaSurveyDocImage

    if (documentPlace) image = SurveyDocImages.assocDocumentPlace(documentPlace)(image)
    if (applyIf) image = SurveyDocImages.assocApplyIf(applyIf)(image)

    return image
  },
}
