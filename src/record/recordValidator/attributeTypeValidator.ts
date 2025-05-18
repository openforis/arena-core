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
import { Record } from '../record'

interface AttributeTypeValidatorParams {
  survey: Survey
  categoryItemProvider?: CategoryItemProvider
  taxonProvider?: TaxonProvider
  record: Record
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
}

interface AttributeTypeValidatorInternalParams extends AttributeTypeValidatorParams {
  node: Node
  value: any
}

const validateDecimal = async (params: AttributeTypeValidatorInternalParams): Promise<boolean> => {
  const { value } = params
  return Numbers.isFloat(value)
  // TODO validate max number of decimal digits as warning?
  // const maxNumberDecimalDigits = NodeDef.getMaxNumberDecimalDigits(nodeDef)
  // const numberDecimalDigits = (Number(value).toString().split('.')[1] || '').length
  // return numberDecimalDigits <= maxNumberDecimalDigits
}

const validateCode = async (params: AttributeTypeValidatorInternalParams) => {
  const { survey, record, node, categoryItemProvider } = params
  const itemUuid = NodeValues.getItemUuid(node)
  if (!itemUuid) return true

  let item = Surveys.getCategoryItemByUuid({ survey, itemUuid })
  if (item) return true

  if (!categoryItemProvider) return false

  // loookup item with categoryItemProvider
  const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: node.nodeDefUuid }) as NodeDefCode
  const categoryUuid = NodeDefs.getCategoryUuid(nodeDef)
  if (!categoryUuid) return false
  const draft = !record.preview
  item = await categoryItemProvider.getItemByUuid({ survey, categoryUuid, itemUuid, draft })
  return Boolean(item)
}

const validateTaxon = async (params: AttributeTypeValidatorInternalParams): Promise<boolean> => {
  const { survey, record, node, taxonProvider } = params
  const taxonUuid = NodeValues.getTaxonUuid(node)
  if (!taxonUuid) return true

  let taxon = Surveys.getTaxonByUuid({ survey, taxonUuid })
  if (!taxon && taxonProvider) {
    // lookup taxon with taxonProvider
    const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: node.nodeDefUuid }) as NodeDefTaxon
    const taxonomyUuid = NodeDefs.getTaxonomyUuid(nodeDef)
    if (!taxonomyUuid) return false
    const draft = !record.preview
    taxon = await taxonProvider.getTaxonByUuid({ survey, taxonomyUuid, taxonUuid, draft })
  }
  if (!taxon) return false

  const vernacularNameUuid = NodeValues.getVernacularNameUuid(node)
  if (!vernacularNameUuid) return true

  const vernacularName = Taxa.getVernacularNameByUuid(vernacularNameUuid)(taxon)
  return !!vernacularName
}

const typeValidatorFns: {
  [key in NodeDefType]?: (params: AttributeTypeValidatorInternalParams) => Promise<boolean>
} = {
  [NodeDefType.boolean]: async (params: AttributeTypeValidatorInternalParams): Promise<boolean> =>
    ['true', 'false'].includes(params.value),
  [NodeDefType.code]: validateCode,
  [NodeDefType.coordinate]: async (params: AttributeTypeValidatorInternalParams): Promise<boolean> => {
    const { survey, node } = params

    const point = NodeValues.getValueAsPoint({ survey, node })
    if (!point) return false

    const srsIndex = Surveys.getSRSIndex(survey)

    return Points.isValid(point, srsIndex)
  },

  [NodeDefType.date]: async (params: AttributeTypeValidatorInternalParams): Promise<boolean> => {
    const { node } = params
    const [year, month, day] = [
      NodeValues.getDateYear(node),
      NodeValues.getDateMonth(node),
      NodeValues.getDateDay(node),
    ]
    return Dates.isValidDate(year, month, day)
  },

  [NodeDefType.decimal]: validateDecimal,

  [NodeDefType.integer]: async (params: AttributeTypeValidatorInternalParams): Promise<boolean> => {
    const { value } = params
    return Numbers.isInteger(value)
  },

  [NodeDefType.taxon]: validateTaxon,

  [NodeDefType.text]: async (params: AttributeTypeValidatorInternalParams): Promise<boolean> => {
    const { value } = params
    return typeof value === 'string' || value instanceof String
  },

  [NodeDefType.time]: async (params: AttributeTypeValidatorInternalParams): Promise<boolean> => {
    const { node } = params
    const [hour, minute] = [NodeValues.getTimeHour(node), NodeValues.getTimeMinute(node)]
    return Dates.isValidTime(hour, minute)
  },
}

const validateValueType =
  (params: AttributeTypeValidatorParams) =>
  async (_propName: string, node: Node): Promise<ValidationResult> => {
    const { survey, nodeDef, record, categoryItemProvider, taxonProvider } = params

    if (Nodes.isValueBlank(node)) return ValidationResultFactory.createInstance()

    const typeValidatorFn = typeValidatorFns[nodeDef.type]
    const valid =
      (await typeValidatorFn?.({
        survey,
        categoryItemProvider,
        taxonProvider,
        record,
        nodeDef,
        node,
        value: node.value,
      })) ?? true
    return ValidationResultFactory.createInstance({ key: 'record.attribute.valueInvalid', valid })
  }

export const AttributeTypeValidator = {
  validateValueType,
}
