import { Objects } from '../../utils'
import {
  FieldValidators,
  Validation,
  ValidationResult,
  ValidationResultFactory,
  ValidationSeverity,
  Validator,
  ValidatorErrorKeys,
} from '../../validation'
import { Survey } from '../survey'

const validateSurveyNameUniqueness = (survey: Survey, surveys: Survey[]) => (
  _field: string,
  _obj: any
): ValidationResult =>
  ValidationResultFactory.createInstance({
    valid: Boolean(!Objects.isEmpty(surveys) && surveys.find((s) => s.id !== survey.id)),
    messageKey: ValidatorErrorKeys.nameDuplicate,
    severity: ValidationSeverity.error,
  })

export const validateNewSurvey = async (survey: Survey, surveys: Survey[]): Promise<Validation> => {
  const propsValidators = {
    name: [
      FieldValidators.required(ValidatorErrorKeys.nameRequired),
      FieldValidators.notKeyword(ValidatorErrorKeys.nameCannotBeKeyword),
      validateSurveyNameUniqueness(survey, surveys),
    ],
    lang: [FieldValidators.required(ValidatorErrorKeys.surveyInfoEdit.langRequired)],
  }

  const validator = new Validator()
  return await validator.validate(survey.props, propsValidators)
}
