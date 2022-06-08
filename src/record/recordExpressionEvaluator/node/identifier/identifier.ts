import { IdentifierExpression } from '../../../../expression'
import { IdentifierEvaluator } from '../../../../expression/javascript/node/identifier'
import { Node } from '../../../../node'
import { NodeDef, NodeDefs, NodeDefType } from '../../../../nodeDef'
import { Records } from '../../../records'
import { NodeValues } from '../../../../node/nodeValues'
import { Survey, Surveys } from '../../../../survey'
import { RecordExpressionContext } from '../../context'
import { NodesFinder } from './nodesFinder'
import { SystemError } from '../../../../error'
import { FieldValidators } from '../../../../validation'
import { NodeValueExtractor } from '../../nodeValueExtractor'
import { Record } from '../../../record'

const isValidNodeDefName = (nodeDefName: string) =>
  FieldValidators.name('expression.invalidNodeDefName')('name', { name: nodeDefName }).valid

const getNodesOrValues = (params: {
  survey: Survey
  referencedNodes: Node[]
  nodeDefReferenced: NodeDef<any>
  propName: string
  evaluateToNode?: boolean
}): any[] => {
  const { survey, nodeDefReferenced, referencedNodes, propName, evaluateToNode } = params
  const single = !nodeDefReferenced.props.multiple
  if (single) {
    if (referencedNodes.length === 0)
      throw new SystemError('expression.nodeNotFoundForNodeDef', { nodeDefName: propName })
    if (referencedNodes.length > 1)
      throw new SystemError('expression.multipleNodesFoundForNodeDef', { nodeDefName: propName })
  }
  if (nodeDefReferenced.type === NodeDefType.entity || evaluateToNode) {
    // return nodes
    return referencedNodes
  }
  // return node values
  return referencedNodes.map((referencedNode) =>
    NodeValueExtractor.getNodeValue({ survey, node: referencedNode, nodeDef: nodeDefReferenced })
  )
}

const evaluateIdentifierOnNode = (params: {
  survey: Survey
  record: Record
  nodeObject: Node
  evaluateToNode: boolean
  propName: string
}) => {
  const { survey, record, nodeObject, evaluateToNode, propName } = params
  const { nodeDefUuid: nodeDefObjectUuid, value } = nodeObject
  if (!nodeDefObjectUuid) {
    throw new SystemError('expression.identifierNotFound', { name: propName })
  }

  const nodeDefObject = Surveys.getNodeDefByUuid({ survey, uuid: nodeDefObjectUuid })

  // node value prop (native)
  if (value && value[propName] !== undefined) {
    return value[propName]
  }
  if (NodeDefs.isAttribute(nodeDefObject)) {
    // node value prop (Arena specific value property)
    if (NodeValues.isValueProp({ nodeDef: nodeDefObject, prop: propName })) {
      return NodeValues.getValueProp({ nodeDef: nodeDefObject, node: nodeObject, prop: propName })
    } else {
      throw new SystemError('expression.invalidAttributeValuePropertyName', {
        attributeName: nodeDefObject.props.name || '',
        propName,
      })
    }
  }

  if (!isValidNodeDefName(propName)) {
    throw new SystemError('expression.identifierNotFound', { name: propName })
  }

  const nodeDefReferenced = Surveys.getNodeDefByName({ survey, name: propName })

  if (nodeObject.nodeDefUuid === nodeDefReferenced.uuid) {
    // the referenced node is the current node itself
    return nodeObject
  }
  if (Surveys.isNodeDefAncestor({ nodeDefAncestor: nodeDefReferenced, nodeDefDescendant: nodeDefObject })) {
    // if the rerenced node is an ancestor of the context node, return it following the hierarchy
    try {
      return Records.getAncestor({ record, node: nodeObject, ancestorDefUuid: nodeDefReferenced.uuid })
    } catch (e) {
      throw new SystemError('expression.ancestorNotFound', {
        ancestorDefName: nodeDefReferenced.props.name || '',
        descendantDefName: nodeDefObject.props.name || '',
      })
    }
  }
  // the referenced nodes can be siblings of the current node
  const referencedNodes = NodesFinder.findDescendants({ survey, record, nodeContext: nodeObject, nodeDefReferenced })
  const nodesOrValues = getNodesOrValues({ survey, referencedNodes, nodeDefReferenced, propName, evaluateToNode })
  return nodeDefReferenced.props.multiple ? nodesOrValues : nodesOrValues[0]
}

export class RecordIdentifierEvaluator extends IdentifierEvaluator<RecordExpressionContext> {
  evaluate(expressionNode: IdentifierExpression): any {
    try {
      const result = super.evaluate(expressionNode)
      return result
    } catch (e) {
      // ignore it
    }

    // identifier not found
    // identifier should be a node or a node value property
    const { name: propName } = expressionNode
    const { survey, record, evaluateToNode, object: contextObject } = this.context

    if (Array.isArray(contextObject)) {
      const result = contextObject.reduce((acc, contextNode) => {
        const evaluationResult = evaluateIdentifierOnNode({
          survey,
          record,
          nodeObject: contextNode,
          evaluateToNode: evaluateToNode || false,
          propName,
        })
        return Array.isArray(evaluationResult) ? [...acc, ...evaluationResult] : [...acc, evaluationResult]
      }, [])
      return result
    } else {
      return evaluateIdentifierOnNode({
        survey,
        record,
        nodeObject: contextObject,
        evaluateToNode: evaluateToNode || false,
        propName,
      })
    }
  }
}
