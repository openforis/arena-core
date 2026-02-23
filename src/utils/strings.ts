import { Objects } from './_objects'

type TextType = string | undefined | null

const compare = (text1: TextType, text2: TextType): number => {
  if (Objects.isNil(text1) && Objects.isNil(text2)) return 0
  if (Objects.isNil(text1)) return -1
  if (Objects.isNil(text2)) return 1
  return text1!.localeCompare(text2!)
}

const compareIgnoreCase = (text1: TextType, text2: TextType): number => {
  if (Objects.isNil(text1) && Objects.isNil(text2)) return 0
  if (Objects.isNil(text1)) return -1
  if (Objects.isNil(text2)) return 1
  return text1!.toLowerCase().localeCompare(text2!.toLowerCase())
}

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

const appendIfMissing = (suffix: string) => (text: TextType) =>
  text?.endsWith(suffix) ? text : `${text ?? ''}${suffix}`

const prependIfMissing = (prefix: string) => (text: TextType) =>
  text?.startsWith(prefix) ? text : `${prefix}${text ?? ''}`

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
  compare,
  compareIgnoreCase,
  defaultIfEmpty,
  padStart,
  quote,
  quoteDouble,
  removePrefix,
  removeSuffix,
  appendIfMissing,
  prependIfMissing,
  repeat,
  unquote,
  unquoteDouble,
}
