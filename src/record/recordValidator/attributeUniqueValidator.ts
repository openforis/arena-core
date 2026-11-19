import { ArenaRecordNode, RecordNodes, RecordNodeValues } from '../../node'
import { ArenaNodeDef, ArenaNodeDefProps, NodeDefs, NodeDefType } from '../../nodeDef'
import { ArenaSurvey, Surveys } from '../../survey'
import { ArenaValidationResult, ValidationResultFactory, ValidationSeverity } from '../../validation'
import { ArenaRecord } from '../record'
import { Records } from '../records'

const _isAttributeDuplicate = (params: {
  survey: ArenaSurvey
  record: ArenaRecord
  attribute: ArenaRecordNode
  nodeDef: ArenaNodeDef<NodeDefType, ArenaNodeDefProps>
}): boolean => {
  const { survey, attribute, record, nodeDef } = params
  // blank values are never considered duplicates
  if (RecordNodes.isValueBlank(attribute)) return false
  const nodeSiblings = Records.getAttributeSiblings(attribute, nodeDef)(record)
  return nodeSiblings.some((sibling) =>
    RecordNodeValues.isValueEqual({ survey, nodeDef, value: sibling.value, valueSearch: attribute.value })
  )
}

const isNodeDefToBeValidated = (params: {
  survey: ArenaSurvey
  nodeDef: ArenaNodeDef<NodeDefType, ArenaNodeDefProps>
}): boolean => {
  const { survey, nodeDef } = params
  const nodeDefValidations = NodeDefs.getValidations(nodeDef)
  if (!nodeDefValidations?.unique) return false

  const nodeDefParent = Surveys.getNodeDefParent({ survey, nodeDef })
  if (!nodeDefParent || NodeDefs.isRoot(nodeDefParent)) {
    // uniqueness at record level evaluated elsewhere
    return false
  }
  return true
}

export const validateAttributeUnique =
  (params: { survey: ArenaSurvey; record: ArenaRecord; nodeDef: ArenaNodeDef<NodeDefType, ArenaNodeDefProps> }) =>
  (_propName: string, node: ArenaRecordNode): Promise<ArenaValidationResult> => {
    const { survey, record, nodeDef } = params

    if (
      isNodeDefToBeValidated({ survey, nodeDef }) &&
      _isAttributeDuplicate({ survey, record, attribute: node, nodeDef })
    ) {
      return Promise.resolve(
        ValidationResultFactory.createInstance({
          valid: false,
          severity: ValidationSeverity.error,
          key: 'record.attribute.uniqueDuplicate',
        })
      )
    }

    return Promise.resolve(ValidationResultFactory.createInstance())
  }

export const AttributeUniqueValidator = {
  validateAttributeUnique,
}
