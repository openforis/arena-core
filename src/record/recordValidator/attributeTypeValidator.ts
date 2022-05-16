import * as R from 'ramda'

import { PointFactory, Points } from '@openforis/arena-core'

import * as DateTimeUtils from '@core/dateUtils'
import * as NumberUtils from '@core/numberUtils'

import * as Taxon from '@core/survey/taxon'

import * as Validation from '@core/validation/validation'

import * as Node from '../node'
import { NodeDef, NodeDefProps, NodeDefs, NodeDefType } from '../../nodeDef'
import { Nodes, NodeValueCoordinate } from '../../node'
import { FieldValidator } from '../../validation'
import { Survey, Surveys } from '../../survey'
import { NodeValues } from '../../node/nodeValues'

const { nodeDefType } = NodeDef

const validateDecimal = ({ nodeDef, value }) => {
  return NumberUtils.isFloat(value)
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
  return Survey.includesTaxonVernacularName(nodeDef, Taxon.getCode(taxon), vernacularNameUuid)(survey)
}

const typeValidatorFns: {
  [key in NodeDefType]: (params: { survey?: Survey; node?: Node; value: any }) => FieldValidator
} = {
  [nodeDefType.boolean]: (params: { value: any }) => ['true', 'false'].includes(params.value),

  [nodeDefType.code]: (params: { survey: Survey; node: Node }) => {
    const { survey, node } = params
    return validateCode({ survey, node })
  },

  [nodeDefType.coordinate]: (params: { node }) => {
    const { node } = params
    const nodeValue = node.value as NodeValueCoordinate
    const point = PointFactory.createInstance({
      srs: nodeValue.srs,
      x: nodeValue.x,
      y: nodeValue.y,
    })
    return point && Points.isValid(point)
  },

  [nodeDefType.date]: (params: { node: Node }) => {
    const { node } = params
    const [year, month, day] = [Node.getDateYear(node), Node.getDateMonth(node), Node.getDateDay(node)]
    return DateTimeUtils.isValidDate(year, month, day)
  },

  [nodeDefType.decimal]: (params: { nodeDef; value }) => validateDecimal({ nodeDef, value }),

  [nodeDefType.file]: () => true,

  [nodeDefType.integer]: (params: { value }) => NumberUtils.isInteger(value),

  [nodeDefType.taxon]: (params: { survey; nodeDef; node }) => validateTaxon({ survey, nodeDef, node }),

  [nodeDefType.text]: (params: { value }) => R.is(String, value),

  [nodeDefType.time]: (params: { node }) => {
    const [hour, minute] = [Node.getTimeHour(node), Node.getTimeMinute(node)]
    return DateTimeUtils.isValidTime(hour, minute)
  },
}

const validateValueType =
  (params: { survey: Survey; nodeDef: NodeDef<NodeDefType, NodeDefProps> }) => (_propName: string, node: Node) => {
    const { survey, nodeDef } = params

    if (Nodes.isValueBlank(node)) return null

    const typeValidatorFn = typeValidatorFns[nodeDef.type]
    const valid = typeValidatorFn({ survey, nodeDef, node, value: Node.getValue(node) })
    return valid ? null : { key: Validation.messageKeys.record.valueInvalid }
  }

export const AttributeTypeValidator = {
  validateValueType,
}
