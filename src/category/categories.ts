import { ExtraPropDef, ExtraPropDefs } from '../extraProp'
import { Category } from './category'

const getExtraPropDefs = (category: Category): ExtraPropDefs | undefined => category.props.itemExtraDef

const getExtraPropDefNames = (category: Category): string[] => Object.keys(getExtraPropDefs(category) || {})

const getExtraPropDefByName =
  (name: string) =>
  (category: Category): ExtraPropDef | undefined =>
    getExtraPropDefs(category)?.[name]

export const Categories = {
  getExtraPropDefs,
  getExtraPropDefNames,
  getExtraPropDefByName,
}
