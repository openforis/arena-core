import { LanguageCode } from '../language'
import { getLabelOrDefault } from '../language/labels'
import { CategoryItem } from './item'

const getCode = (item: CategoryItem): string => item.props.code ?? ''

const getIndex = (item: CategoryItem): number => item.props.index ?? Number.NaN

const getLabel = (item: CategoryItem, lang: LanguageCode, defaultToCode?: boolean): string =>
  getLabelOrDefault(item.props.labels, lang, defaultToCode ? getCode(item) : '')

const getLabelWithCode = (item: CategoryItem, lang: LanguageCode): string => {
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
