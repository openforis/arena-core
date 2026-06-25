import { Labels, LanguageCode } from '../language'
import { ValidationResult, ValidationSeverity } from './validation'

const getKey = (result: ValidationResult): string | undefined => result.key

const getParams = (result: ValidationResult): { [key: string]: any } | undefined => result.params

const getSeverity = (result: ValidationResult): ValidationSeverity | undefined => result.severity

const getMessages = (result: ValidationResult): Labels | undefined => result.messages

const getMessage =
  (lang: LanguageCode) =>
  (result: ValidationResult): string | undefined =>
    result.messages?.[lang]

const hasMessages = (result: ValidationResult): boolean =>
  result.messages != null && Object.keys(result.messages).length > 0

const isError = (result: ValidationResult): boolean => result.severity === ValidationSeverity.error

export const ValidationResults = {
  getKey,
  getParams,
  getSeverity,
  getMessages,
  getMessage,
  hasMessages,
  isError,
}
