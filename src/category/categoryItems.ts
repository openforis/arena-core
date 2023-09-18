import { LanguageCode } from '../language'
import { Strings } from '../utils'
import { CategoryItem } from './item'

const getCode = (item: CategoryItem): string => item.props.code ?? ''

const getLabelOrCode = (item: CategoryItem, lang: LanguageCode) =>
  Strings.defaultIfEmpty(getCode(item))(item.props.labels?.[lang])

export const CategoryItems = {
  getCode,
  getLabelOrCode,
}
