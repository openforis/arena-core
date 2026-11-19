import { ArenaExtraPropDef, ArenaExtraPropDefs } from '../extraProp'
import { ArenaCategory } from './category'

const getExtraPropDefs = (category: ArenaCategory): ArenaExtraPropDefs | undefined => category.props.itemExtraDef

const getExtraPropDefNames = (category: ArenaCategory): string[] => Object.keys(getExtraPropDefs(category) ?? {})

const getExtraPropDefByName =
  (name: string) =>
  (category: ArenaCategory): ArenaExtraPropDef | undefined =>
    getExtraPropDefs(category)?.[name]

export const Categories = {
  getExtraPropDefs,
  getExtraPropDefNames,
  getExtraPropDefByName,
}
