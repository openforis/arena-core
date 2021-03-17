import { NodeDefType } from '../../../nodeDef'
import { NodeDefAttributeBuilder } from './nodeDefAttributeBuilder'
import { NodeDefBuilder } from './nodeDefBuilder'
import { NodeDefEntityBuilder } from './nodeDefEntityBuilder'

export { SurveyBuilder } from './surveyBuilder'

export const entityDef = (name: string, ...childBuilders: NodeDefBuilder[]): NodeDefEntityBuilder =>
  new NodeDefEntityBuilder(name, ...childBuilders)

export const booleanDef = (name: string) => new NodeDefAttributeBuilder(name, NodeDefType.boolean)
export const codeDef = (name: string) => new NodeDefAttributeBuilder(name, NodeDefType.code)
export const coordinateDef = (name: string) => new NodeDefAttributeBuilder(name, NodeDefType.coordinate)
export const dateDef = (name: string) => new NodeDefAttributeBuilder(name, NodeDefType.date)
export const decimalDef = (name: string) => new NodeDefAttributeBuilder(name, NodeDefType.decimal)
export const fileDef = (name: string) => new NodeDefAttributeBuilder(name, NodeDefType.file)
export const integerDef = (name: string) => new NodeDefAttributeBuilder(name, NodeDefType.integer)
export const taxonDef = (name: string) => new NodeDefAttributeBuilder(name, NodeDefType.taxon)
export const textDef = (name: string) => new NodeDefAttributeBuilder(name, NodeDefType.text)
export const timeDef = (name: string) => new NodeDefAttributeBuilder(name, NodeDefType.time)
