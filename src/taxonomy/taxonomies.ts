import { ExtraPropDef } from '../extraProp'
import { Taxonomy } from './taxonomy'

const getExtraPropDefs = (taxonomy: Taxonomy) => taxonomy.props.extraPropsDefs

const getExtraPropDefNames = (taxonomy: Taxonomy): string[] => Object.keys(getExtraPropDefs(taxonomy) || {})

const getExtraPropDefByName =
  (name: string) =>
  (taxonomy: Taxonomy): ExtraPropDef | undefined =>
    getExtraPropDefs(taxonomy)?.[name]

export const Taxonomies = {
  getExtraPropDefs,
  getExtraPropDefNames,
  getExtraPropDefByName,
}
