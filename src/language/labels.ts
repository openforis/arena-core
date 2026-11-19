import { LanguageCode } from './languageCode'

export type ArenaLabels = {
  [code in LanguageCode]?: string
}

/**
 * Returns the label in the specified language, or the default value when it is missing or empty.
 */
export const getLabelOrDefault = (
  labels: ArenaLabels | undefined,
  lang: LanguageCode | undefined,
  defaultValue = ''
): string => {
  const label = lang ? labels?.[lang] : undefined
  return label || defaultValue
}
