import { NodeDefType } from '../../../nodeDef'
import { CategoryBuilder } from './categoryBuilder'
import { CategoryItemBuilder } from './categoryItemBuilder'
import { TaxonBuilder } from './taxonBuilder'
import { TaxonomyBuilder } from './taxonomyBuilder'
import { NodeDefAttributeBuilder } from './nodeDefAttributeBuilder'
import { NodeDefBuilder } from './nodeDefBuilder'
import { NodeDefEntityBuilder } from './nodeDefEntityBuilder'

export { SurveyBuilder } from './surveyBuilder'

export const category = (name: string): CategoryBuilder => new CategoryBuilder(name)
export const categoryItem = (code: string): CategoryItemBuilder => new CategoryItemBuilder(code)

export const taxonomy = (name: string): TaxonomyBuilder => new TaxonomyBuilder(name)
export const taxon = (code: string, family: string, genus: string, scientificName: string): TaxonBuilder =>
  new TaxonBuilder(code, family, genus, scientificName)

export const entityDef = (name: string, ...childBuilders: NodeDefBuilder[]): NodeDefEntityBuilder =>
  new NodeDefEntityBuilder(name, ...childBuilders)

export const booleanDef = (name: string): NodeDefAttributeBuilder =>
  new NodeDefAttributeBuilder(name, NodeDefType.boolean)
export const codeDef = (name: string): NodeDefAttributeBuilder => new NodeDefAttributeBuilder(name, NodeDefType.code)
export const coordinateDef = (name: string): NodeDefAttributeBuilder =>
  new NodeDefAttributeBuilder(name, NodeDefType.coordinate)
export const dateDef = (name: string): NodeDefAttributeBuilder => new NodeDefAttributeBuilder(name, NodeDefType.date)
export const decimalDef = (name: string): NodeDefAttributeBuilder =>
  new NodeDefAttributeBuilder(name, NodeDefType.decimal)
export const fileDef = (name: string): NodeDefAttributeBuilder => new NodeDefAttributeBuilder(name, NodeDefType.file)
export const integerDef = (name: string): NodeDefAttributeBuilder =>
  new NodeDefAttributeBuilder(name, NodeDefType.integer)
export const taxonDef = (name: string): NodeDefAttributeBuilder => new NodeDefAttributeBuilder(name, NodeDefType.taxon)
export const textDef = (name: string): NodeDefAttributeBuilder => new NodeDefAttributeBuilder(name, NodeDefType.text)
export const timeDef = (name: string): NodeDefAttributeBuilder => new NodeDefAttributeBuilder(name, NodeDefType.time)
