import { NodeDef, NodeDefCode, NodeDefProps, NodeDefs, NodeDefTaxon, NodeDefType } from '../../nodeDef'
import { Node, Nodes } from '../../node'
import { ValidationResult, ValidationResultFactory } from '../../validation'
import { Survey, Surveys } from '../../survey'
import { NodeValues } from '../../node/nodeValues'
import { Points } from '../../geo'
import { Numbers, Dates } from '../../utils'
import { CategoryItemProvider } from '../../nodeDefExpressionEvaluator/categoryItemProvider'
import { TaxonProvider } from '../../nodeDefExpressionEvaluator/taxonProvider'
import { Taxa } from '../../taxonomy'

const validateDecimal = async (params: { value: any }): Promise<boolean> => {
  const { value } = params
  return Numbers.isFloat(value)
  // TODO validate max number of decimal digits as warning?
  // const maxNumberDecimalDigits = NodeDef.getMaxNumberDecimalDigits(nodeDef)
  // const numberDecimalDigits = (Number(value).toString().split('.')[1] || '').length
  // return numberDecimalDigits <= maxNumberDecimalDigits
}

const validateCode = async (params: { survey: Survey; node: Node; categoryItemProvider?: CategoryItemProvider }) => {
  const { survey, node, categoryItemProvider } = params
  const itemUuid = NodeValues.getItemUuid(node)
  if (!itemUuid) return true

  let item = Surveys.getCategoryItemByUuid({ survey, itemUuid })
  if (item) return true

  if (!categoryItemProvider) return false

  // loookup item with categoryItemProvider
  const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: node.nodeDefUuid }) as NodeDefCode
  const categoryUuid = NodeDefs.getCategoryUuid(nodeDef)
  if (!categoryUuid) return false
  item = await categoryItemProvider.getItemByUuid({ survey, categoryUuid, itemUuid })
  return Boolean(item)
}

const validateTaxon = async (params: {
  survey: Survey
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
  node: Node
  taxonProvider?: TaxonProvider
}): Promise<boolean> => {
  const { survey, node, taxonProvider } = params
  const taxonUuid = NodeValues.getTaxonUuid(node)
  if (!taxonUuid) return true

  let taxon = Surveys.getTaxonByUuid({ survey, taxonUuid })
  if (!taxon && taxonProvider) {
    // lookup taxon with taxonProvider
    const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: node.nodeDefUuid }) as NodeDefTaxon
    const taxonomyUuid = NodeDefs.getTaxonomyUuid(nodeDef)
    if (!taxonomyUuid) return false
    taxon = await taxonProvider.getTaxonByUuid({ survey, taxonomyUuid, taxonUuid })
  }
  if (!taxon) return false

  const vernacularNameUuid = NodeValues.getVernacularNameUuid(node)
  if (!vernacularNameUuid) return true

  const vernacularName = Taxa.getVernacularNameByUuid(vernacularNameUuid)(taxon)
  return !!vernacularName
}

const typeValidatorFns: {
  [key in NodeDefType]?: (params: {
    survey: Survey
    categoryItemProvider?: CategoryItemProvider
    taxonProvider?: TaxonProvider
    nodeDef: NodeDef<NodeDefType, NodeDefProps>
    node: Node
    value: any
  }) => Promise<boolean>
} = {
  [NodeDefType.boolean]: async (params: { value?: any }): Promise<boolean> => ['true', 'false'].includes(params.value),
  [NodeDefType.code]: validateCode,
  [NodeDefType.coordinate]: async (params: { survey: Survey; node: Node }): Promise<boolean> => {
    const { survey, node } = params

    const point = NodeValues.getValueAsPoint({ survey, node })
    if (!point) return false

    const srsIndex = Surveys.getSRSIndex(survey)

    return Points.isValid(point, srsIndex)
  },

  [NodeDefType.date]: async (params: { node: Node }): Promise<boolean> => {
    const { node } = params
    const [year, month, day] = [
      NodeValues.getDateYear(node),
      NodeValues.getDateMonth(node),
      NodeValues.getDateDay(node),
    ]
    return Dates.isValidDate(year, month, day)
  },

  [NodeDefType.decimal]: validateDecimal,

  [NodeDefType.integer]: async (params: { value: any }): Promise<boolean> => {
    const { value } = params
    return Numbers.isInteger(value)
  },

  [NodeDefType.taxon]: validateTaxon,

  [NodeDefType.text]: async (params: { value: any }): Promise<boolean> => {
    const { value } = params
    return typeof value === 'string' || value instanceof String
  },

  [NodeDefType.time]: async (params: { node: Node }): Promise<boolean> => {
    const { node } = params
    const [hour, minute] = [NodeValues.getTimeHour(node), NodeValues.getTimeMinute(node)]
    return Dates.isValidTime(hour, minute)
  },
}

const validateValueType =
  (params: {
    survey: Survey
    nodeDef: NodeDef<NodeDefType, NodeDefProps>
    categoryItemProvider?: CategoryItemProvider
    taxonProvider?: TaxonProvider
  }) =>
  async (_propName: string, node: Node): Promise<ValidationResult> => {
    const { survey, nodeDef, categoryItemProvider, taxonProvider } = params

    if (Nodes.isValueBlank(node)) return ValidationResultFactory.createInstance()

    const typeValidatorFn = typeValidatorFns[nodeDef.type]
    const valid =
      (await typeValidatorFn?.({ survey, categoryItemProvider, taxonProvider, nodeDef, node, value: node.value })) ??
      true
    return ValidationResultFactory.createInstance({ key: 'record.attribute.valueInvalid', valid })
  }

export const AttributeTypeValidator = {
  validateValueType,
}
