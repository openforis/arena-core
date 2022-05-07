import { NodeDefType } from '../../../nodeDef'
import { CategoryBuilder } from './categoryBuilder'
import { CategoryItemBuilder } from './categoryItemBuilder'
import { TaxonBuilder } from './taxonBuilder'
import { TaxonomyBuilder } from './taxonomyBuilder'
import { NodeDefAttributeBuilder } from './nodeDefAttributeBuilder'
import { NodeDefBuilder } from './nodeDefBuilder'
import { NodeDefCodeBuilder } from './nodeDefCodeBuilder'
import { NodeDefEntityBuilder } from './nodeDefEntityBuilder'
import { NodeDefTaxonBuilder } from './nodeDefTaxonBuilder'

export { SurveyBuilder } from './surveyBuilder'

const category = (name: string): CategoryBuilder => new CategoryBuilder(name)
const categoryItem = (code: string): CategoryItemBuilder => new CategoryItemBuilder(code)

const taxonomy = (name: string): TaxonomyBuilder => new TaxonomyBuilder(name)
const taxon = (code: string, family: string, genus: string, scientificName: string): TaxonBuilder =>
  new TaxonBuilder(code, family, genus, scientificName)

const entityDef = (name: string, ...childBuilders: NodeDefBuilder[]): NodeDefEntityBuilder =>
  new NodeDefEntityBuilder(name, ...childBuilders)

const booleanDef = (name: string): NodeDefAttributeBuilder => new NodeDefAttributeBuilder(name, NodeDefType.boolean)
const codeDef = (name: string, categoryName: string): NodeDefCodeBuilder => new NodeDefCodeBuilder(name, categoryName)
const coordinateDef = (name: string): NodeDefAttributeBuilder =>
  new NodeDefAttributeBuilder(name, NodeDefType.coordinate)
const dateDef = (name: string): NodeDefAttributeBuilder => new NodeDefAttributeBuilder(name, NodeDefType.date)
const decimalDef = (name: string): NodeDefAttributeBuilder => new NodeDefAttributeBuilder(name, NodeDefType.decimal)
const fileDef = (name: string): NodeDefAttributeBuilder => new NodeDefAttributeBuilder(name, NodeDefType.file)
const integerDef = (name: string): NodeDefAttributeBuilder => new NodeDefAttributeBuilder(name, NodeDefType.integer)
const taxonDef = (name: string, taxonomyName: string): NodeDefTaxonBuilder =>
  new NodeDefTaxonBuilder(name, taxonomyName)
const textDef = (name: string): NodeDefAttributeBuilder => new NodeDefAttributeBuilder(name, NodeDefType.text)
const timeDef = (name: string): NodeDefAttributeBuilder => new NodeDefAttributeBuilder(name, NodeDefType.time)

export const SurveyObjectBuilders = {
  category,
  categoryItem,

  taxonomy,
  taxon,

  entityDef,

  booleanDef,
  codeDef,
  coordinateDef,
  dateDef,
  decimalDef,
  fileDef,
  integerDef,
  taxonDef,
  textDef,
  timeDef,
}
