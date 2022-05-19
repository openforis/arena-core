import { Node, Nodes } from '../../node'
import { NodeDef, NodeDefProps, NodeDefs, NodeDefType } from '../../nodeDef'
import { Records } from '../records'
import { Validation, ValidationFactory, ValidationResultFactory, ValidationSeverity } from '../../validation'
import { Record } from '../record'
import { Numbers } from '../../utils'
import { Survey, Surveys } from '../../survey'
import { NodePointer } from '../../node'

const _createValidationResult = (params: {
  nodeDefUuid: string
  isMinCountValidation: boolean
  minCount: number
  maxCount: number
}): Validation => {
  const { nodeDefUuid, isMinCountValidation, minCount, maxCount } = params

  if (minCount === maxCount) {
    return ValidationFactory.createInstance({
      valid: false,
      errors: [
        ValidationResultFactory.createInstance({
          key: 'record.nodes.count.invalid',
          params: { nodeDefUuid, count: minCount },
          severity: ValidationSeverity.error,
        }),
      ],
    })
  }
  return ValidationFactory.createInstance({
    valid: false,
    errors: [
      ValidationResultFactory.createInstance({
        key: isMinCountValidation ? 'record.nodes.count.minNotReached' : 'record.nodes.count.maxExceeded',
        params: { nodeDefUuid, ...(isMinCountValidation ? { minCount } : { maxCount }) },
        severity: ValidationSeverity.error,
      }),
    ],
  })
}

const validateChildrenCount = (params: {
  nodeDefChild: NodeDef<NodeDefType, NodeDefProps>
  count: number
}): Validation => {
  const { nodeDefChild, count } = params
  const validations = NodeDefs.getValidations(nodeDefChild)

  const minCount = Numbers.toNumber(validations?.min)
  const maxCount = Numbers.toNumber(validations?.max)

  const minCountValid = Number.isNaN(minCount) || count >= minCount
  const maxCountValid = Number.isNaN(maxCount) || count <= maxCount

  return minCountValid && maxCountValid
    ? ValidationFactory.createInstance()
    : _createValidationResult({
        nodeDefUuid: nodeDefChild.uuid,
        isMinCountValidation: !minCountValid,
        minCount,
        maxCount,
      })
}

const _countChildren = (params: { record: Record; parentNode: Node; childDef: NodeDef<NodeDefType, NodeDefProps> }) => {
  const { record, parentNode, childDef } = params
  const children = Records.getChildren({ record, parentNode, childDefUuid: childDef.uuid })
  const nonEmptyChildren = NodeDefs.isAttribute(childDef)
    ? children.filter((child) => !Nodes.isValueBlank(child))
    : children
  return nonEmptyChildren.length
}

const _validateNodePointer = (params: {
  record: Record
  nodeCtx: Node
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
}) => {
  const { record, nodeCtx, nodeDef } = params
  // Check children count only for applicable nodes
  if (Nodes.isChildApplicable(nodeCtx, nodeDef.uuid)) {
    if (NodeDefs.hasMinOrMaxCount(nodeDef)) {
      const count = _countChildren({ record, parentNode: nodeCtx, childDef: nodeDef })
      return validateChildrenCount({ nodeDefChild: nodeDef, count })
    }
  }
  return ValidationFactory.createInstance()
}

const _getNodePointersToValidate = (params: { survey: Survey; record: Record; node: Node }): NodePointer[] => {
  const { survey, record, node } = params
  const nodePointersToValidate: NodePointer[] = []

  const nodeDef = Surveys.getNodeDefByUuid({ uuid: node.nodeDefUuid, survey })

  const nodeParent = Records.getParent({ record, node })
  if (nodeParent) {
    // always validate the node itself
    nodePointersToValidate.push({ nodeCtx: nodeParent, nodeDef })
  }
  if (NodeDefs.isEntity(nodeDef) && !node.deleted) {
    // validate the count of every node def children
    const childDefs = Surveys.getNodeDefChildren({ survey, nodeDef })
    childDefs.forEach((childDef) => nodePointersToValidate.push({ nodeCtx: node, nodeDef: childDef }))
  }
  return nodePointersToValidate
}

const validateChildrenCountNodes = (params: {
  survey: Survey
  record: Record
  nodes: { [key: string]: Node }
}): { [key: string]: Validation } => {
  const { survey, record, nodes } = params
  return Object.values(nodes).reduce((validationsAcc, node) => {
    const validationsAccUpdated: { [key: string]: Validation } = { ...validationsAcc }
    const nodePointersToValidate = _getNodePointersToValidate({ survey, record, node })

    nodePointersToValidate.forEach((nodePointer) => {
      // check if validated already
      const validationChildrenCountKey = Records.getValidationChildrenCountKey({
        nodeParentUuid: nodePointer.nodeCtx.uuid,
        nodeDefChildUuid: nodePointer.nodeDef.uuid,
      })
      if (!(validationChildrenCountKey in validationsAccUpdated)) {
        // validate the children count of this node pointer
        const validationNodePointer = _validateNodePointer({
          record,
          nodeCtx: nodePointer.nodeCtx,
          nodeDef: nodePointer.nodeDef,
        })
        validationsAccUpdated[validationChildrenCountKey] = validationNodePointer
      }
    })
    return validationsAccUpdated
  }, {})
}

export const CountValidator = {
  validateChildrenCount,
  validateChildrenCountNodes,
}
