import { Objects } from './_objects'

type TextType = string | undefined | null

const defaultIfEmpty =
  (defaultValue: string) =>
  (text: TextType): string =>
    Objects.isEmpty(text) ? defaultValue : (text as string)

const quote = (text: TextType): string => (Objects.isEmpty(text) ? '' : `'${text}'`)

const removePrefix =
  (prefix: string) =>
  (text: TextType): string => {
    if (Objects.isEmpty(text)) return ''
    return text?.startsWith(prefix) ? text.substring(prefix.length) : (text as string)
  }

const removeSuffix =
  (suffix: string) =>
  (text: TextType): string => {
    if (Objects.isEmpty(text)) return ''
    return text?.endsWith(suffix) ? text.substring(0, text.length - suffix.length) : (text as string)
  }

const repeat = (text: string, times: number): string => {
  const parts = []
  for (let i = 0; i < times; i++) {
    parts.push(text)
  }
  return parts.join('')
}

export const Strings = {
  defaultIfEmpty,
  quote,
  removePrefix,
  removeSuffix,
  repeat,
}
