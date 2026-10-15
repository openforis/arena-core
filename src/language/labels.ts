import { LanguageCode } from './languageCode'

export type Labels = {
  [code in LanguageCode]?: string
}

/**
 * Returns the label in the specified language, or the default value when it is missing or empty.
 */
export const getLabelOrDefault = (
  labels: Labels | undefined,
  lang: LanguageCode | undefined,
  defaultValue = ''
): string => {
  const label = lang ? labels?.[lang] : undefined
  return label || defaultValue
}
