import { ExpressionVariable, IdentifierExpression } from '../../../../expression'
import { IdentifierEvaluator } from '../../../../expression/javascript/node/identifier'
import { Node } from '../../../../node'
import { NodeDef, NodeDefs, NodeDefType } from '../../../../nodeDef'
import { Records } from '../../../records'
import { NodeValues } from '../../../../node/nodeValues'
import { Survey, Surveys } from '../../../../survey'
import { RecordExpressionContext } from '../../context'
import { NodesFinder } from './nodesFinder'
import { SystemError } from '../../../../error'
import { NodeValueExtractor } from '../../nodeValueExtractor'
import { Record } from '../../../record'

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
    if (referencedNodes.length === 0) {
      // do not throw error if node is missing, consider its value as null
      // throw new SystemError('expression.nodeNotFoundForNodeDef', { nodeDefName: propName })
      return []
    }
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
  evaluateToNode?: boolean
  propName: string
}) => {
  const { survey, record, nodeObject, evaluateToNode = false, propName } = params
  const { nodeDefUuid: nodeDefObjectUuid, value } = nodeObject
  if (!nodeDefObjectUuid) {
    throw new SystemError('expression.identifierNotFound', { name: propName })
  }

  const nodeDefObject = Surveys.getNodeDefByUuid({ survey, uuid: nodeDefObjectUuid })

  // node value prop (native)
  const valueProp = value?.[propName]
  if (valueProp !== undefined) {
    return valueProp
  }
  if (NodeDefs.isAttribute(nodeDefObject)) {
    // node value prop (Arena specific value property)
    if (NodeValues.isValueProp({ nodeDef: nodeDefObject, prop: propName })) {
      return NodeValues.getNodeValueProp({ nodeDef: nodeDefObject, node: nodeObject, prop: propName })
    } else {
      throw new SystemError('expression.invalidAttributeValuePropertyName', {
        attributeName: NodeDefs.getName(nodeDefObject),
        propName,
      })
    }
  }

  const nodeDefReferenced = Surveys.findNodeDefByName({ survey, name: propName })

  if (!nodeDefReferenced) {
    throw new SystemError('expression.identifierNotFound', { name: propName })
  }

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
        ancestorDefName: NodeDefs.getName(nodeDefReferenced),
        descendantDefName: NodeDefs.getName(nodeDefObject),
      })
    }
  }
  // the referenced nodes can be siblings of the current node
  const referencedNodes = NodesFinder.findDescendants({ survey, record, nodeContext: nodeObject, nodeDefReferenced })
  const nodesOrValues = getNodesOrValues({ survey, referencedNodes, nodeDefReferenced, propName, evaluateToNode })
  return nodeDefReferenced.props.multiple ? nodesOrValues : nodesOrValues[0]
}

export class RecordIdentifierEvaluator extends IdentifierEvaluator<RecordExpressionContext> {
  async evaluate(expressionNode: IdentifierExpression): Promise<any> {
    const { name: propName } = expressionNode

    if (propName === ExpressionVariable.CONTEXT) {
      return this.context.nodeContext
    }

    // try to find identifier among global or native properties
    try {
      const result = await super.evaluate(expressionNode)
      return result
    } catch (e) {
      // ignore it
    }

    // identifier not found among global or native properties
    // idenfifier should be a node or a node value property
    const { survey, record, evaluateToNode, object: contextObject, item } = this.context

    if (item && item === contextObject) {
      // evaluating category or taxon item prop or extra prop
      return item.props?.[propName] ?? item.props?.extra?.[propName]
    }

    if (Array.isArray(contextObject)) {
      const result = contextObject.reduce((acc, contextNode) => {
        const evaluationResult = evaluateIdentifierOnNode({
          survey,
          record,
          nodeObject: contextNode,
          evaluateToNode,
          propName,
        })
        if (Array.isArray(evaluationResult)) {
          for (const item of evaluationResult) {
            acc.push(item)
          }
        } else {
          acc.push(evaluationResult)
        }
        return acc
      }, [])
      return result
    } else {
      return evaluateIdentifierOnNode({
        survey,
        record,
        nodeObject: contextObject,
        evaluateToNode,
        propName,
      })
    }
  }
}
