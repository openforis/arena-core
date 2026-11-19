import { ArenaLabels, LanguageCode } from '../language'
import { ArenaValidationResult, ValidationSeverity } from './validation'

const getKey = (result: ArenaValidationResult): string | undefined => result?.key

const getParams = (result: ArenaValidationResult): { [key: string]: any } | undefined => result?.params

const getSeverity = (result: ArenaValidationResult): ValidationSeverity => result?.severity ?? ValidationSeverity.error

const getMessages = (result: ArenaValidationResult): ArenaLabels | undefined => result?.messages

const getMessage =
  (lang: LanguageCode) =>
  (result: ArenaValidationResult): string | undefined =>
    result?.messages?.[lang] ?? Object.values(result?.messages ?? {})[0] // fallback to first message if the requested language is not available

const hasMessages = (result: ArenaValidationResult): boolean =>
  result?.messages != null && Object.keys(result.messages).length > 0

const isError = (result: ArenaValidationResult): boolean => getSeverity(result) === ValidationSeverity.error

export const ValidationResults = {
  getKey,
  getParams,
  getSeverity,
  getMessages,
  getMessage,
  hasMessages,
  isError,
}
