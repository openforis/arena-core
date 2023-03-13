import { Objects } from './_objects'

const defaultIfEmpty =
  (defaultValue: string) =>
  (text: string | undefined | null): string =>
    Objects.isEmpty(text) ? defaultValue : (text as string)

const removePrefix =
  (prefix: string) =>
  (text: string | undefined | null): string => {
    if (Objects.isEmpty(text)) return ''
    return text?.startsWith(prefix) ? text.substring(prefix.length) : (text as string)
  }

const removeSuffix =
  (suffix: string) =>
  (text: string | undefined | null): string => {
    if (Objects.isEmpty(text)) return ''
    return text?.endsWith(suffix) ? text.substring(0, text.length - suffix.length) : (text as string)
  }

export const Strings = {
  defaultIfEmpty,
  removePrefix,
  removeSuffix,
}
