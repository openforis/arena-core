import { NodeDef, NodeDefProps, NodeDefTaxon, NodeDefType } from '../../nodeDef'
import { Node, Nodes, NodeValueCoordinate } from '../../node'
import { ValidationResult, ValidationResultFactory } from '../../validation'
import { Survey, Surveys } from '../../survey'
import { NodeValues } from '../../node/nodeValues'
import { PointFactory, Points } from '../../geo'
import { Numbers, Dates } from '../../utils'

const validateDecimal = (params: { value: any }) => {
  const { value } = params
  return Numbers.isFloat(value)
  // TODO validate max number of decimal digits as warning?
  // const maxNumberDecimalDigits = NodeDef.getMaxNumberDecimalDigits(nodeDef)
  // const numberDecimalDigits = (Number(value).toString().split('.')[1] || '').length
  // return numberDecimalDigits <= maxNumberDecimalDigits
}

const validateCode = (params: { survey: Survey; node: Node }) => {
  const { survey, node } = params
  const itemUuid = NodeValues.getItemUuid(node)
  if (!itemUuid) return true

  // Item not found
  const item = Surveys.getCategoryItemByUuid({ survey, itemUuid })
  return Boolean(item)
}

const validateTaxon = (params: { survey: Survey; nodeDef: NodeDef<NodeDefType, NodeDefProps>; node: Node }) => {
  const { survey, nodeDef, node } = params
  const taxonUuid = NodeValues.getTaxonUuid(node)
  if (!taxonUuid) return true

  // Taxon not found
  const taxon = Surveys.getTaxonByUuid({ survey, taxonUuid })
  if (!taxon) return false

  const vernacularNameUuid = NodeValues.getVernacularNameUuid(node)
  if (!vernacularNameUuid) return true

  // Vernacular name not found
  return Surveys.includesTaxonVernacularName({
    survey,
    nodeDef: nodeDef as NodeDefTaxon,
    taxonCode: taxon.props.code,
    vernacularNameUuid,
  })
}

const typeValidatorFns: {
  [key in NodeDefType]: (params: {
    survey: Survey
    nodeDef: NodeDef<NodeDefType, NodeDefProps>
    node: Node
    value: any
  }) => boolean
} = {
  [NodeDefType.boolean]: (params: { value?: any }): boolean => ['true', 'false'].includes(params.value),
  [NodeDefType.code]: validateCode,
  [NodeDefType.coordinate]: (params: { node: Node }): boolean => {
    const { node } = params
    const nodeValue = node.value as NodeValueCoordinate
    const point = PointFactory.createInstance({
      srs: nodeValue.srs,
      x: nodeValue.x,
      y: nodeValue.y,
    })
    return point && Points.isValid(point)
  },

  [NodeDefType.date]: (params: { node: Node }): boolean => {
    const { node } = params
    const [year, month, day] = [
      NodeValues.getDateYear(node),
      NodeValues.getDateMonth(node),
      NodeValues.getDateDay(node),
    ]
    return Dates.isValidDate(year, month, day)
  },

  [NodeDefType.decimal]: validateDecimal,

  [NodeDefType.entity]: () => true,

  [NodeDefType.file]: () => true,

  [NodeDefType.integer]: (params: { value: any }): boolean => {
    const { value } = params
    return Numbers.isInteger(value)
  },

  [NodeDefType.taxon]: validateTaxon,

  [NodeDefType.text]: (params: { value: any }): boolean => {
    const { value } = params
    return typeof value === 'string' || value instanceof String
  },

  [NodeDefType.time]: (params: { node: Node }): boolean => {
    const { node } = params
    const [hour, minute] = [NodeValues.getTimeHour(node), NodeValues.getTimeMinute(node)]
    return Dates.isValidTime(hour, minute)
  },
}

const validateValueType =
  (params: { survey: Survey; nodeDef: NodeDef<NodeDefType, NodeDefProps> }) =>
  (_propName: string, node: Node): ValidationResult => {
    const { survey, nodeDef } = params

    if (Nodes.isValueBlank(node)) return ValidationResultFactory.createInstance()

    const typeValidatorFn = typeValidatorFns[nodeDef.type]
    const valid = typeValidatorFn({ survey, nodeDef, node, value: node.value })
    return ValidationResultFactory.createInstance({ key: 'record.node.valueInvalid', valid })
  }

export const AttributeTypeValidator = {
  validateValueType,
}
