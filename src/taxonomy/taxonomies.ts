import { ArenaExtraPropDef } from '../extraProp'
import { ArenaTaxonomy } from './taxonomy'

const getExtraPropDefs = (taxonomy: ArenaTaxonomy) => taxonomy.props.extraPropsDefs

const getExtraPropDefNames = (taxonomy: ArenaTaxonomy): string[] => Object.keys(getExtraPropDefs(taxonomy) ?? {})

const getExtraPropDefByName =
  (name: string) =>
  (taxonomy: ArenaTaxonomy): ArenaExtraPropDef | undefined =>
    getExtraPropDefs(taxonomy)?.[name]

export const Taxonomies = {
  getExtraPropDefs,
  getExtraPropDefNames,
  getExtraPropDefByName,
}
