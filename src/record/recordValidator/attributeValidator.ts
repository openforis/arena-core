import { Node } from '../../node'
import { NodeDefs } from '../../nodeDef'
import { Survey, Surveys } from '../../survey'
import { SurveyDependencyType } from '../../survey/survey'
import { Promises } from '../../utils/promises'
import { Validation, ValidationFactory } from '../../validation'
import { Record } from '../record'
import { NodePointer } from '../recordNodesUpdater/nodePointer'
import { Records } from '../records'

const _nodePointersToNodes = (nodePointers: NodePointer[]): Node[] =>
  nodePointers.map((nodePointer) => nodePointer.nodeCtx)

const _getSiblingNodeKeys = (params: { survey: Survey; record: Record; node: Node }) => {
  const { survey, record, node } = params

  const parentNode = Records.getParent({ record, node }) || Records.getRoot(record)
  const siblings = Records.getChildren({ record, parentNode, childDefUuid: node.nodeDefUuid })

  const siblingKeys = siblings.reduce(
    (acc: Node[], sibling) => [...acc, ...Records.getEntityKeyNodes({ survey, record, entity: sibling })],
    []
  )

  return siblingKeys
}

const validateAttribute = async (params: { survey: Survey; record: Record; attribute: Node }) => {
  const { survey, record, attribute } = params
  if (Records.isNodeApplicable({ record, node: attribute })) {
    const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: attribute.nodeDefUuid })
    return Validator.validate(
      attribute,
      {
        [Node.keys.value]: [
          _validateRequired({ nodeDef }),
          AttributeTypeValidator.validateValueType(survey, nodeDef),
          _validateNodeValidations(survey, record, nodeDef),
          AttributeKeyValidator.validateAttributeKey(survey, record, nodeDef),
          AttributeUniqueValidator.validateAttributeUnique(survey, record, nodeDef),
        ],
      },
      false
    )
  }

  return ValidationFactory.createInstance()
}

const validateSelfAndDependentAttributes = async (params: {
  survey: Survey
  record: Record
  nodes: { [key: string]: Node }
}) => {
  const { survey, record, nodes } = params

  // Output
  const attributeValidations: { [key: string]: Validation } = {}

  await Promises.each(Object.values(nodes), async (node: Node) => {
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

      const nodeParent = Records.getParent({ record, node })

      const nodesToValidate = [
        ..._nodePointersToNodes(nodePointersAttributeAndDependents),
        ...(NodeDefs.isKey(nodeDef) && nodeParent ? _getSiblingNodeKeys({ survey, record, node: nodeParent }) : []),
        ...(NodeDefs.getValidations(nodeDef)?.unique
          ? Records.getAttributesUniqueSibling({ record, attribute: node, attributeDef: nodeDef })
          : []),
      ]

      // Call validateAttribute for each attribute

      await Promises.each<Node>(nodesToValidate, async (_node) => {
        const nodeUuid = node.uuid

        // Validate only attributes not deleted and not validated already
        if (!_node.deleted && !attributeValidations[nodeUuid]) {
          attributeValidations[nodeUuid] = await validateAttribute({ survey, record, attribute: _node })
        }
      })
    }
  })

  return attributeValidations
}

export const AttributeValidator = {
  validateSelfAndDependentAttributes,
}
