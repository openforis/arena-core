import { ArenaAnyNodeDef, ArenaNodeDefCode, NodeDefs, ArenaNodeDefTaxon, NodeDefType } from '../../nodeDef'
import { ArenaRecordNode, RecordNodes } from '../../node'
import { ArenaValidationResult, ValidationResultFactory } from '../../validation'
import { ArenaSurvey, Surveys } from '../../survey'
import { RecordNodeValues } from '../../node/nodeValues'
import { Points } from '../../geo'
import { Numbers, Dates } from '../../utils'
import { ArenaCategoryItemProvider } from '../../nodeDefExpressionEvaluator/categoryItemProvider'
import { ArenaTaxonProvider } from '../../nodeDefExpressionEvaluator/taxonProvider'
import { Taxa } from '../../taxonomy'
import { ArenaRecord } from '../record'

interface AttributeTypeValidatorParams {
  survey: ArenaSurvey
  categoryItemProvider?: ArenaCategoryItemProvider
  taxonProvider?: ArenaTaxonProvider
  record: ArenaRecord
  nodeDef: ArenaAnyNodeDef
}

interface AttributeTypeValidatorInternalParams extends AttributeTypeValidatorParams {
  node: ArenaRecordNode
  value: any
}

const validateDecimal = (params: AttributeTypeValidatorInternalParams): boolean => {
  const { value } = params
  // the max number of decimal digits is not validated: it is applied when formatting the value (see nodeValueFormatter)
  return Numbers.isFloat(value)
}

const validateCode = async (params: AttributeTypeValidatorInternalParams) => {
  const { survey, record, node, categoryItemProvider } = params
  const itemUuid = RecordNodeValues.getItemUuid(node)
  if (!itemUuid) return true

  let item = Surveys.getCategoryItemByUuid({ survey, itemUuid })
  if (item) return true

  if (!categoryItemProvider) return false

  // loookup item with categoryItemProvider
  const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: node.nodeDefUuid }) as ArenaNodeDefCode
  const categoryUuid = NodeDefs.getCategoryUuid(nodeDef)
  if (!categoryUuid) return false
  const draft = !!record.preview
  item = await categoryItemProvider.getItemByUuid({ survey, categoryUuid, itemUuid, draft })
  return Boolean(item)
}

const validateTaxon = async (params: AttributeTypeValidatorInternalParams): Promise<boolean> => {
  const { survey, record, node, taxonProvider } = params
  const taxonUuid = RecordNodeValues.getTaxonUuid(node)
  if (!taxonUuid) return true

  let taxon = Surveys.getTaxonByUuid({ survey, taxonUuid })
  if (!taxon && taxonProvider) {
    // lookup taxon with taxonProvider
    const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: node.nodeDefUuid }) as ArenaNodeDefTaxon
    const taxonomyUuid = NodeDefs.getTaxonomyUuid(nodeDef)
    if (!taxonomyUuid) return false
    const draft = !!record.preview
    taxon = await taxonProvider.getTaxonByUuid({ survey, taxonomyUuid, taxonUuid, draft })
  }
  if (!taxon) return false

  const vernacularNameUuid = RecordNodeValues.getVernacularNameUuid(node)
  if (!vernacularNameUuid) return true

  const vernacularName = Taxa.getVernacularNameByUuid(vernacularNameUuid)(taxon)
  return !!vernacularName
}

const typeValidatorFns: {
  [key in NodeDefType]?: (params: AttributeTypeValidatorInternalParams) => boolean | Promise<boolean>
} = {
  [NodeDefType.boolean]: (params: AttributeTypeValidatorInternalParams): boolean =>
    ['true', 'false'].includes(params.value),
  [NodeDefType.code]: validateCode,
  [NodeDefType.coordinate]: (params: AttributeTypeValidatorInternalParams): boolean => {
    const { survey, node } = params

    const point = RecordNodeValues.getValueAsPoint({ survey, node })
    if (!point) return false

    const srsIndex = Surveys.getSRSIndex(survey)

    return Points.isValid(point, srsIndex)
  },

  [NodeDefType.date]: (params: AttributeTypeValidatorInternalParams): boolean => {
    const { node } = params
    const [year, month, day] = [
      RecordNodeValues.getDateYear(node),
      RecordNodeValues.getDateMonth(node),
      RecordNodeValues.getDateDay(node),
    ]
    return Dates.isValidDate(year, month, day)
  },

  [NodeDefType.decimal]: validateDecimal,

  [NodeDefType.integer]: (params: AttributeTypeValidatorInternalParams): boolean => {
    const { value } = params
    return Numbers.isInteger(value)
  },

  [NodeDefType.taxon]: validateTaxon,

  [NodeDefType.text]: (params: AttributeTypeValidatorInternalParams): boolean => {
    const { value } = params
    return typeof value === 'string'
  },

  [NodeDefType.time]: (params: AttributeTypeValidatorInternalParams): boolean => {
    const { node } = params
    const [hour, minute, seconds] = [
      RecordNodeValues.getTimeHour(node),
      RecordNodeValues.getTimeMinute(node),
      RecordNodeValues.getTimeSeconds(node),
    ]
    return Dates.isValidTime(hour, minute, seconds)
  },
}

const validateValueType =
  (params: AttributeTypeValidatorParams) =>
  async (_propName: string, node: ArenaRecordNode): Promise<ArenaValidationResult> => {
    const { survey, nodeDef, record, categoryItemProvider, taxonProvider } = params

    if (RecordNodes.isValueBlank(node)) return ValidationResultFactory.createInstance()

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
