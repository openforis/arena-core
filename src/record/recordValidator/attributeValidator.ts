import { User } from '../../auth'
import { Dictionary } from '../../common'
import { Labels } from '../../language'
import { Node, Nodes } from '../../node'
import { NodeDef, NodeDefExpression, NodeDefProps, NodeDefs, NodeDefType } from '../../nodeDef'
import { Survey, Surveys } from '../../survey'
import { SurveyDependencyType } from '../../survey/survey'
import { Objects, Promises } from '../../utils'
import {
  ValidationFactory,
  ValidationResult,
  ValidationResultFactory,
  ValidationSeverity,
  Validator,
} from '../../validation'
import { ValidationFields } from '../../validation/validation'
import { NodePointers } from '../nodePointers'
import { Record } from '../record'
import { RecordExpressionEvaluator } from '../recordExpressionEvaluator'
import { Records } from '../records'
import { AttributeKeyValidator } from './attributeKeyValidator'
import { AttributeTypeValidator } from './attributeTypeValidator'
import { AttributeUniqueValidator } from './attributeUniqueValidator'

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
  const messages: Labels = expression.messages ?? {}

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
  (params: { user: User; survey: Survey; record: Record; nodeDef: NodeDef<NodeDefType, NodeDefProps> }) =>
  (_propName: string, node: Node): ValidationResult => {
    const { user, survey, record, nodeDef } = params
    if (Nodes.isValueBlank(node)) return ValidationResultFactory.createInstance()

    const validations = NodeDefs.getValidations(nodeDef)
    if (!validations?.expressions?.length) return ValidationResultFactory.createInstance()

    const applicableExpressionsEval = new RecordExpressionEvaluator().evalApplicableExpressions({
      user,
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

const validateAttribute = async (params: { user: User; survey: Survey; record: Record; attribute: Node }) => {
  const { user, survey, record, attribute } = params
  if (Records.isNodeApplicable({ record, node: attribute })) {
    const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: attribute.nodeDefUuid })
    return new Validator().validate(attribute, {
      ['value']: [
        _validateRequired({ nodeDef }),
        AttributeTypeValidator.validateValueType({ survey, nodeDef }),
        _validateNodeValidations({ user, survey, record, nodeDef }),
        AttributeKeyValidator.validateAttributeKey({ survey, record, nodeDef }),
        AttributeUniqueValidator.validateAttributeUnique({ survey, record, nodeDef }),
      ],
    })
  }

  return ValidationFactory.createInstance()
}

const validateSelfAndDependentAttributes = async (params: {
  user: User
  survey: Survey
  record: Record
  nodes: Dictionary<Node>
}): Promise<ValidationFields> => {
  const { user, survey, record, nodes } = params

  // Output
  const validationsByNodeUuid: ValidationFields = {}

  await Promises.each(Object.values(nodes), async (node) => {
    const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: node.nodeDefUuid })
    if (NodeDefs.isAttribute(nodeDef)) {
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
      await Promises.each(nodesToValidate, async (nodeToValidate) => {
        const nodeUuid = nodeToValidate.uuid

        // Validate only attributes not deleted and not validated already
        if (!nodeToValidate.deleted && !validationsByNodeUuid[nodeUuid]) {
          validationsByNodeUuid[nodeUuid] = await validateAttribute({ user, survey, record, attribute: nodeToValidate })
        }
      })
    }
  })

  return validationsByNodeUuid
}

export const AttributeValidator = {
  validateSelfAndDependentAttributes,
}
