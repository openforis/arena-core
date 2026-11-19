import { LanguageCode } from '../language'
import { getLabelOrDefault } from '../language/labels'
import { ArenaCategoryItem } from './item'

const getCode = (item: ArenaCategoryItem): string => item.props.code ?? ''

const getIndex = (item: ArenaCategoryItem): number => item.props.index ?? Number.NaN

const getLabel = (item: ArenaCategoryItem, lang: LanguageCode, defaultToCode?: boolean): string =>
  getLabelOrDefault(item.props.labels, lang, defaultToCode ? getCode(item) : '')

const getLabelWithCode = (item: ArenaCategoryItem, lang: LanguageCode): string => {
  const code = getCode(item)
  const label = getLabel(item, lang)
  return label ? `${label} (${code})` : code
}

export const CategoryItems = {
  getCode,
  getIndex,
  getLabel,
  getLabelWithCode,
}
