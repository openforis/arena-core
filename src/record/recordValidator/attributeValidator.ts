import { Node, Nodes } from '../../node'
import { NodeDef, NodeDefType, NodeDefProps, NodeDefs, NodeDefExpression } from '../../nodeDef'
import { Survey, Surveys } from '../../survey'
import { SurveyDependencyType } from '../../survey/survey'
import {
  ValidationFactory,
  ValidationResult,
  ValidationResultFactory,
  ValidationSeverity,
  Validator,
} from '../../validation'
import { Record } from '../record'
import { RecordExpressionEvaluator } from '../recordExpressionEvaluator'
import { Records } from '../records'
import { NodePointers } from '../nodePointers'
import { Labels } from '../../language'
import { Objects, Promises } from '../../utils'
import { AttributeTypeValidator } from './attributeTypeValidator'
import { AttributeUniqueValidator } from './attributeUniqueValidator'
import { AttributeKeyValidator } from './attributeKeyValidator'
import { ValidationFields } from '../../validation/validation'

const _getSiblingNodeKeys = (params: { survey: Survey; record: Record; node: Node }): Node[] => {
  const { survey, record, node } = params

  const parentNode = Records.getParent(node)(record) || Records.getRoot(record)
  const siblingNodes = parentNode ? Records.getChildren(parentNode, node.nodeDefUuid)(record) : []

  const siblingKeyNodes = siblingNodes.reduce(
    (acc: Node[], sibling) => [...acc, ...Records.getEntityKeyNodes({ survey, record, entity: sibling })],
    []
  )

  return siblingKeyNodes
}

const _getValidationMessagesWithDefault = (params: {
  survey: Survey
  expression: NodeDefExpression
  defaultMessage?: string
}): Labels => {
  const { survey, expression, defaultMessage } = params
  const messages: Labels = expression.messages || {}

  const languages = survey.props.languages

  for (const lang of languages) {
    const customMessage = messages[lang]
    if (Objects.isEmpty(customMessage) && !Objects.isEmpty(defaultMessage)) {
      messages[lang] = defaultMessage
    }
  }

  return messages
}

const _validateRequired =
  (params: { nodeDef: NodeDef<NodeDefType, NodeDefProps> }) =>
  (_field: string, node: any): ValidationResult => {
    const { nodeDef } = params
    const valid = (!NodeDefs.isKey(nodeDef) && !NodeDefs.isRequired(nodeDef)) || !Nodes.isValueBlank(node)
    return valid
      ? ValidationResultFactory.createInstance()
      : ValidationResultFactory.createInstance({
          key: 'record.attribute.valueRequired',
          severity: ValidationSeverity.error,
          valid,
        })
  }

/**
 * Evaluates the validation expressions.
 * Returns 'null' if all are valid, a concatenated error message otherwise.
 */
const _validateNodeValidations =
  (params: { survey: Survey; record: Record; nodeDef: NodeDef<NodeDefType, NodeDefProps> }) =>
  (_propName: string, node: Node): ValidationResult => {
    const { survey, record, nodeDef } = params
    if (Nodes.isValueBlank(node)) return ValidationResultFactory.createInstance()

    const validations = NodeDefs.getValidations(nodeDef)
    if (!validations?.expressions?.length) return ValidationResultFactory.createInstance()

    const applicableExpressionsEval = new RecordExpressionEvaluator().evalApplicableExpressions({
      survey,
      record,
      nodeCtx: node,
      expressions: validations.expressions,
      stopAtFirstFound: false,
    })

    let validationResult = ValidationResultFactory.createInstance()

    for (const { expression, value: valid } of applicableExpressionsEval) {
      if (!valid) {
        const messages = _getValidationMessagesWithDefault({
          survey,
          expression,
          defaultMessage: expression.expression,
        })

        validationResult = ValidationResultFactory.createInstance({
          valid: false,
          key: 'record.attribute.customValidation',
          severity: expression.severity,
          messages,
        })
        break
      }
    }

    return validationResult
  }

const validateAttribute = async (params: { survey: Survey; record: Record; attribute: Node }) => {
  const { survey, record, attribute } = params
  if (Records.isNodeApplicable({ record, node: attribute })) {
    const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: attribute.nodeDefUuid })
    return new Validator().validate(attribute, {
      ['value']: [
        _validateRequired({ nodeDef }),
        AttributeTypeValidator.validateValueType({ survey, nodeDef }),
        _validateNodeValidations({ survey, record, nodeDef }),
        AttributeKeyValidator.validateAttributeKey({ survey, record, nodeDef }),
        AttributeUniqueValidator.validateAttributeUnique({ survey, record, nodeDef }),
      ],
    })
  }

  return ValidationFactory.createInstance()
}

const validateSelfAndDependentAttributes = async (params: {
  survey: Survey
  record: Record
  nodes: { [key: string]: Node }
}): Promise<ValidationFields> => {
  const { survey, record, nodes } = params

  // Output
  const validationsByNodeUuid: ValidationFields = {}

  const attributes = Object.values(nodes).filter((node) => {
    const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: node.nodeDefUuid })
    return NodeDefs.isAttribute(nodeDef)
  })
  await Promises.each(attributes, async (node: Node) => {
    const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: node.nodeDefUuid })

    // Get dependents and attribute itself
    const nodePointersAttributeAndDependents = Records.getDependentNodePointers({
      survey,
      record,
      node,
      dependencyType: SurveyDependencyType.validations,
      includeSelf: true,
    })

    const nodeParent = Records.getParent(node)(record)

    const nodesToValidate = [
      ...NodePointers.getNodesFromNodePointers({ record, nodePointers: nodePointersAttributeAndDependents }),
      ...(NodeDefs.isKey(nodeDef) && nodeParent ? _getSiblingNodeKeys({ survey, record, node: nodeParent }) : []),
      ...(NodeDefs.getValidations(nodeDef)?.unique ? Records.getNodeSiblings({ record, node, nodeDef }) : []),
    ]

    // Call validateAttribute for each attribute

    await Promises.each<Node>(nodesToValidate, async (nodeToValidate) => {
      const nodeUuid = nodeToValidate.uuid

      // Validate only attributes not deleted and not validated already
      if (!nodeToValidate.deleted && !validationsByNodeUuid[nodeUuid]) {
        validationsByNodeUuid[nodeUuid] = await validateAttribute({ survey, record, attribute: nodeToValidate })
      }
    })
  })

  return validationsByNodeUuid
}

export const AttributeValidator = {
  validateSelfAndDependentAttributes,
}
