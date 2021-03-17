import { IdentifierExpression } from '../../../expression'
import { IdentifierEvaluator } from '../../../expression/javascript/node/identifier'
import { Node } from '../../../node'
import { NodeDef, NodeDefType } from '../../../nodeDef'
import { Record } from '../../record'
import { Records } from '../../records'
import { Survey, Surveys } from '../../../survey'
import { RecordExpressionContext } from '../context'
import { Objects } from '../../../utils'

// TODO: move this functions to Arrays?
const intersection = (array1: any[], array2: any[]) => array1.filter((item) => array2.indexOf(item) !== -1)
const startsWith = (array1: any[], startWith: any[]) => !startWith.some((item, index) => array1[index] !== item)

const getNodeValue = (params: { survey: Survey; node: Node; nodeDef: NodeDef<any> }) => {
  const { node, nodeDef } = params

  const value = node.value
  if (Objects.isEmpty(value)) {
    return null
  }

  //   if (NodeDef.isCode(nodeDef)) {
  //     const itemUuid = Node.getCategoryItemUuid(node)
  //     const item = itemUuid ? Survey.getCategoryItemByUuid(itemUuid)(survey) : null
  //     return item ? CategoryItem.getCode(item) : null
  //   }

  //   if (NodeDef.isTaxon(nodeDef)) {
  //     const taxonUuid = Node.getTaxonUuid(node)
  //     const taxon = taxonUuid ? Survey.getTaxonByUuid(taxonUuid)(survey) : null
  //     return taxon ? Taxon.getCode(taxon) : null
  //   }

  switch (nodeDef.type) {
    case NodeDefType.decimal:
    case NodeDefType.integer:
      return Number(value)
    case NodeDefType.boolean:
      return value === 'true'
    default:
      return value
  }
}

const getNodeCommonAncestor = (params: {
  record: Record
  nodeCtxHierarchy: string[]
  nodeDefCtx: NodeDef<any>
  nodeDefReferenced: NodeDef<any>
}): Node | undefined => {
  const { record, nodeCtxHierarchy, nodeDefCtx, nodeDefReferenced } = params
  if (!nodeDefCtx.parentUuid) {
    return Records.getRoot(record)
  }
  const nodeDefReferencedH = nodeDefReferenced.meta.h
  const nodeDefCtxH = nodeDefCtx.meta.h
  const nodeDefCommonH = intersection(nodeDefReferencedH, nodeDefCtxH)
  if (nodeDefCommonH.length === 1) {
    return Records.getRoot(record)
  }
  if (nodeDefCommonH.length > 1) {
    const nodeCommonAncestorUuid = nodeCtxHierarchy[nodeDefCommonH.length - 1]
    return record.nodes?.[nodeCommonAncestorUuid]
  }
  return undefined
}

const getReferencedNodesParent = (params: {
  survey: Survey
  record: Record
  nodeCtx: Node
  nodeDefReferenced: NodeDef<any>
}): Node | undefined => {
  const { survey, record, nodeCtx, nodeDefReferenced } = params

  const nodeDefUuidCtx = nodeCtx.nodeDefUuid
  const nodeDefCtx = Surveys.getNodeDefByUuid({ survey, uuid: nodeDefUuidCtx })

  // Referenced node is a child of the context node
  if (nodeDefReferenced.parentUuid === nodeDefCtx.uuid) {
    return nodeCtx
  }

  const nodeDefReferencedH = nodeDefReferenced.meta.h
  const nodeDefCtxH = nodeDefCtx.meta.h

  const nodeCtxH = [...nodeCtx.meta.h]
  if (nodeDefCtx.type === NodeDefType.entity) {
    // When nodeDefCtx is entity, expression is type applicableIf (and context always starts from parent)
    nodeCtxH.push(nodeCtx.uuid)
  }

  if (startsWith(nodeDefCtxH, nodeDefReferencedH)) {
    // Referenced node is a descendant of an ancestor of the context node
    const nodeReferencedParentUuid = nodeCtxH[nodeDefReferencedH.length - 1]
    return record.nodes?.[nodeReferencedParentUuid]
  }
  const nodeCommonAncestor = getNodeCommonAncestor({
    record,
    nodeCtxHierarchy: nodeCtxH,
    nodeDefCtx,
    nodeDefReferenced,
  })
  if (!nodeCommonAncestor) {
    return undefined
  }
  // starting from nodeCommonAncestor, visit descendant entities up to referenced node parent entity
  return nodeDefReferencedH
    .slice(nodeDefReferencedH.indexOf(nodeCommonAncestor.nodeDefUuid) + 1)
    .reduce((parentNode, childDefUuid) => Records.getChild({ record, parentNode, childDefUuid }), nodeCommonAncestor)
}
// Get reachable nodes, i.e. the children of the node's ancestors.
// NOTE: The root node is excluded, but it _should_ be an entity, so that is fine.
const getReferencedNodes = (params: {
  survey: Survey
  record: Record
  node: Node
  nodeDefReferenced: NodeDef<any>
}) => {
  const { survey, record, node, nodeDefReferenced } = params
  const nodeReferencedParent = getReferencedNodesParent({ survey, record, nodeCtx: node, nodeDefReferenced })

  if (nodeReferencedParent) {
    return Records.getChildren({ record, parentNode: nodeReferencedParent, childDefUuid: nodeDefReferenced.uuid })
  }
  return []
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
    const { evaluateToNode } = this.context
    const evaluatorContext: RecordExpressionContext = this.evaluator.context
    const { survey, record, nodeContext: node } = evaluatorContext

    const nodeDefUuid = node.nodeDefUuid
    if (nodeDefUuid) {
      const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: node.nodeDefUuid })

      const value = node.value

      // node value prop
      if (value && Object.prototype.hasOwnProperty.call(value, propName)) {
        return value[propName]
      }

      const nodeDefReferenced = Surveys.getNodeDefByName({ survey, name: propName })

      // referenced node
      let nodeResult = null
      if (nodeDef === nodeDefReferenced) {
        // the referenced node is the current node itself
        nodeResult = node
      } else if (
        Surveys.isNodeDefAncestor({ survey, nodeDefAncestor: nodeDef, nodeDefDescendant: nodeDefReferenced })
      ) {
        // if the rerenced node name is an ancestor of the current node, return it following the hierarchy
        nodeResult = Records.getAncestor({ record, node, ancestorDefUuid: nodeDefReferenced.uuid })
      }
      if (nodeResult) {
        return evaluateToNode || nodeDef.type === NodeDefType.entity
          ? nodeResult
          : getNodeValue({ survey, node: nodeResult, nodeDef })
      }

      // the referenced nodes can be siblings of the current node
      const referencedNodes = getReferencedNodes({ survey, record, node, nodeDefReferenced })

      const single = !nodeDefReferenced.props.multiple
      if (single && (referencedNodes.length === 0 || referencedNodes.length > 1)) {
        throw new Error(`Cannot find node definition with name ${propName}`)
      }

      if (nodeDefReferenced.type !== NodeDefType.entity && !evaluateToNode) {
        // return node values
        const values = referencedNodes.map((referencedNode) =>
          getNodeValue({ survey, node: referencedNode, nodeDef: nodeDefReferenced })
        )
        return single ? values[0] : values
      }
      // return nodes
      return single ? referencedNodes[0] : referencedNodes
    }
    throw new Error(`Cannot find node with name ${name}`)
  }
}
