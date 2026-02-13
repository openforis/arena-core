import { Node, NodePointer, Nodes } from '../../node'
import { NodeDef, NodeDefProps, NodeDefs, NodeDefType } from '../../nodeDef'
import { Records } from '../records'
import { Validation, ValidationFactory, ValidationResultFactory, ValidationSeverity } from '../../validation'
import { Record } from '../record'
import { Survey, Surveys } from '../../survey'
import { RecordValidations } from '../recordValidations'
import { ValidationFields } from '../../validation/validation'

const createValidationResult = (params: {
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
  parentNode: Node
  nodeDefChild: NodeDef<NodeDefType, NodeDefProps>
  count: number
}): Validation => {
  const { parentNode, nodeDefChild, count } = params

  const minCount = Nodes.getChildrenMinCount({ parentNode, nodeDef: nodeDefChild })
  const maxCount = Nodes.getChildrenMaxCount({ parentNode, nodeDef: nodeDefChild })

  const minCountValid = Number.isNaN(minCount) || count >= minCount
  const maxCountValid = Number.isNaN(maxCount) || count <= maxCount

  return minCountValid && maxCountValid
    ? ValidationFactory.createInstance()
    : createValidationResult({
        nodeDefUuid: nodeDefChild.uuid,
        isMinCountValidation: !minCountValid,
        minCount,
        maxCount,
      })
}

const _countChildren = (params: { record: Record; parentNode: Node; childDef: NodeDef<NodeDefType, NodeDefProps> }) => {
  const { record, parentNode, childDef } = params
  const children = Records.getChildren(parentNode, childDef.uuid)(record)
  const nonEmptyChildren = NodeDefs.isAttribute(childDef)
    ? children.filter((child) => !Nodes.isValueBlank(child))
    : children
  return nonEmptyChildren.length
}

const isNodePointerToBeValidated = (nodePointer: NodePointer) => NodeDefs.hasMinOrMaxCount(nodePointer.nodeDef)

const validateNodePointer = (params: {
  record: Record
  nodeCtx: Node
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
}) => {
  const { record, nodeCtx, nodeDef } = params
  // Check children count only for applicable nodes
  if (Nodes.isChildApplicable(nodeCtx, nodeDef.uuid)) {
    const count = _countChildren({ record, parentNode: nodeCtx, childDef: nodeDef })
    return validateChildrenCount({ parentNode: nodeCtx, nodeDefChild: nodeDef, count })
  }
  return ValidationFactory.createInstance()
}

const getNodePointersToValidate = (params: { survey: Survey; record: Record; node: Node }): NodePointer[] => {
  const { survey, record, node } = params
  const nodePointersToValidate: NodePointer[] = []

  const nodeDef = Surveys.getNodeDefByUuid({ uuid: node.nodeDefUuid, survey })

  const nodeParent = Records.getParent(node)(record)
  if (nodeParent) {
    // always validate the node itself
    const nodePointer = { nodeCtx: nodeParent, nodeDef }
    if (isNodePointerToBeValidated(nodePointer)) {
      nodePointersToValidate.push(nodePointer)
    }
  }
  if (NodeDefs.isEntity(nodeDef) && !node.deleted) {
    // validate the count of every node def children
    const childDefs = Surveys.getNodeDefChildren({ survey, nodeDef })
    for (const childDef of childDefs) {
      const nodePointer = { nodeCtx: node, nodeDef: childDef }
      if (isNodePointerToBeValidated(nodePointer)) {
        nodePointersToValidate.push(nodePointer)
      }
    }
  }
  return nodePointersToValidate
}

const validateChildrenCountNodesArray = (params: {
  survey: Survey
  record: Record
  nodesArray: Node[]
}): ValidationFields => {
  const { survey, record, nodesArray } = params
  const validationsAcc: ValidationFields = {}
  for (const node of nodesArray) {
    const nodePointersToValidate = getNodePointersToValidate({ survey, record, node })

    for (const nodePointer of nodePointersToValidate) {
      const { nodeCtx, nodeDef } = nodePointer
      // check if validated already
      const validationChildrenCountKey = RecordValidations.getValidationChildrenCountKey({
        nodeParentInternalId: nodeCtx.iId,
        nodeDefChildUuid: nodeDef.uuid,
      })
      if (!(validationChildrenCountKey in validationsAcc)) {
        // validate the children count of this node pointer
        const validationNodePointer = validateNodePointer({ record, nodeCtx, nodeDef })
        validationsAcc[validationChildrenCountKey] = validationNodePointer
      }
    }
  }
  return validationsAcc
}

const validateChildrenCountNodes = (params: {
  survey: Survey
  record: Record
  nodes: { [key: string]: Node }
}): ValidationFields => validateChildrenCountNodesArray({ ...params, nodesArray: Object.values(params.nodes) })

export const CountValidator = {
  validateChildrenCount,
  validateChildrenCountNodesArray,
  validateChildrenCountNodes,
}
