import { Node, Nodes, NodeValues } from '../../node'
import { NodeDef, NodeDefProps, NodeDefs, NodeDefType } from '../../nodeDef'
import { Survey, Surveys } from '../../survey'
import { ValidationResult, ValidationResultFactory, ValidationSeverity } from '../../validation'
import { Record } from '../record'
import { Records } from '../records'

const _isAttributeDuplicate = (params: {
  survey: Survey
  record: Record
  attribute: Node
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
}): boolean => {
  const { survey, attribute, record, nodeDef } = params
  // blank values are never considered duplicates
  if (Nodes.isValueBlank(attribute)) return false
  const nodeSiblings = Records.getAttributeSiblings({ record, node: attribute, nodeDef })
  return nodeSiblings.some((sibling) =>
    NodeValues.isValueEqual({ survey, nodeDef, value: sibling.value, valueSearch: attribute.value })
  )
}

const isNodeDefToBeValidated = (params: { survey: Survey; nodeDef: NodeDef<NodeDefType, NodeDefProps> }): boolean => {
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
  (params: { survey: Survey; record: Record; nodeDef: NodeDef<NodeDefType, NodeDefProps> }) =>
  (_propName: string, node: Node): Promise<ValidationResult> => {
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
