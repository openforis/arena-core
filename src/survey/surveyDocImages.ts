import { ArenaLabels } from '../language'
import { Objects } from '../utils'
import { ArenaSurveyDocImage, SurveyDocPlace, surveyDocImagePropKeys } from './survey'

const getDocumentPlace = (image: ArenaSurveyDocImage): SurveyDocPlace | undefined =>
  Objects.path(['props', surveyDocImagePropKeys.documentPlace])(image)

const getApplyIf = (image: ArenaSurveyDocImage): string =>
  Objects.path(['props', surveyDocImagePropKeys.applyIf])(image) ?? ''

const assocDocumentPlace =
  (place: SurveyDocPlace) =>
  (image: ArenaSurveyDocImage): ArenaSurveyDocImage =>
    Objects.assocPath({
      obj: image,
      path: ['props', surveyDocImagePropKeys.documentPlace],
      value: place,
    })

const assocApplyIf =
  (expr: string) =>
  (image: ArenaSurveyDocImage): ArenaSurveyDocImage =>
    Objects.assocPath({ obj: image, path: ['props', surveyDocImagePropKeys.applyIf], value: expr })

const assocLabels =
  (labels: ArenaLabels) =>
  (image: ArenaSurveyDocImage): ArenaSurveyDocImage =>
    Objects.assocPath({ obj: image, path: ['props', 'labels'], value: labels })

export const SurveyDocImages = {
  getDocumentPlace,
  getApplyIf,
  assocDocumentPlace,
  assocApplyIf,
  assocLabels,
}
