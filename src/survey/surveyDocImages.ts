import { Labels } from '../language'
import { Objects } from '../utils'
import { SurveyDocImage, SurveyDocPlace, surveyDocImagePropKeys } from './survey'

const getDocumentPlace = (image: SurveyDocImage): SurveyDocPlace | undefined =>
  Objects.path(['props', surveyDocImagePropKeys.documentPlace])(image)

const getApplyIf = (image: SurveyDocImage): string =>
  Objects.path(['props', surveyDocImagePropKeys.applyIf])(image) ?? ''

const assocDocumentPlace =
  (place: SurveyDocPlace) =>
  (image: SurveyDocImage): SurveyDocImage =>
    Objects.assocPath({
      obj: image,
      path: ['props', surveyDocImagePropKeys.documentPlace],
      value: place,
    }) as SurveyDocImage

const assocApplyIf =
  (expr: string) =>
  (image: SurveyDocImage): SurveyDocImage =>
    Objects.assocPath({ obj: image, path: ['props', surveyDocImagePropKeys.applyIf], value: expr }) as SurveyDocImage

const assocLabels =
  (labels: Labels) =>
  (image: SurveyDocImage): SurveyDocImage =>
    Objects.assocPath({ obj: image, path: ['props', 'labels'], value: labels }) as SurveyDocImage

export const SurveyDocImages = {
  getDocumentPlace,
  getApplyIf,
  assocDocumentPlace,
  assocApplyIf,
  assocLabels,
}
