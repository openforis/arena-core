import { Objects } from './_objects'

type TextType = string | undefined | null

const defaultIfEmpty =
  (defaultValue: string) =>
  (text: TextType): string =>
    Objects.isEmpty(text) ? defaultValue : (text as string)

const padStart =
  (length: number, padString: string) =>
  (text: TextType): string =>
    (text ?? '').padStart(length, padString)

const quote = (text: TextType): string => (Objects.isEmpty(text) ? '' : `'${text}'`)

const quoteDouble = (text: TextType): string => (Objects.isEmpty(text) ? '' : `"${text}"`)

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

const _unquoteInternal = (text: TextType, quoteSymbol = "'"): string => {
  if (Objects.isEmpty(text)) return ''
  let result = text as string
  if (result.length > 1 && result.startsWith(quoteSymbol) && result.endsWith(quoteSymbol)) {
    result = removePrefix(quoteSymbol)(result)
    result = removeSuffix(quoteSymbol)(result)
  }
  return result
}

const unquote = (text: TextType): string => _unquoteInternal(text, `'`)

const unquoteDouble = (text: TextType): string => _unquoteInternal(text, `"`)

export const Strings = {
  defaultIfEmpty,
  padStart,
  quote,
  quoteDouble,
  removePrefix,
  removeSuffix,
  repeat,
  unquote,
  unquoteDouble,
}
