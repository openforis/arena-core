import { LanguageCode } from '../language'
import { Strings } from '../utils'
import { CategoryItem } from './item'

const getCode = (item: CategoryItem): string => item.props.code ?? ''

const getLabel = (item: CategoryItem, lang: LanguageCode): string => item.props.labels?.[lang] ?? ''

const getLabelOrCode = (item: CategoryItem, lang: LanguageCode): string => {
  const code = getCode(item)
  const label = getLabel(item, lang)
  return Strings.defaultIfEmpty(code)(label)
}

const getLabelWithCode = (item: CategoryItem, lang: LanguageCode): string => {
  const code = getCode(item)
  const label = getLabel(item, lang)
  return `${label} (${code})`
}

export const CategoryItems = {
  getCode,
  getLabelOrCode,
  getLabelWithCode,
}
