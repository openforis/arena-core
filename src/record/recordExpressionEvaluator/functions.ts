import { Records } from '../records'
import { Nodes } from '../../node'
import { ExpressionFunction } from '../../expression'
import { RecordExpressionContext } from './context'
import { nodeDefExpressionFunctions } from '../../nodeDefExpressionEvaluator/functions'

export const recordExpressionFunctions: ExpressionFunction<RecordExpressionContext>[] = [
  ...nodeDefExpressionFunctions,
  {
    name: 'count',
    minArity: 1,
    evaluateArgsToNodes: true,
    executor: (_context: RecordExpressionContext) => (nodeSet) => {
      if (!nodeSet) return 0
      if (Array.isArray(nodeSet)) return nodeSet.length
      return 0
    },
  },
  {
    name: 'index',
    minArity: 1,
    maxArity: 1,
    evaluateArgsToNodes: true,
    executor: (context: RecordExpressionContext) => (node) => {
      if (!node) {
        return -1
      }
      if (Nodes.isRoot(node)) {
        return 0
      }
      const { record } = context
      const parentNode = Records.getParent(node)(record)
      if (!parentNode) {
        return -1
      }
      const children = Records.getChildren(parentNode, node.nodeDefUuid)(record)
      return children.findIndex((n) => Nodes.areEqual(n, node))
    },
  },
  {
    name: 'parent',
    minArity: 1,
    maxArity: 1,
    evaluateArgsToNodes: true,
    evaluateToNode: true,
    executor: (context: RecordExpressionContext) => (node) => {
      if (!node || Nodes.isRoot(node)) {
        return null
      }
      const { record } = context
      return Records.getParent(node)(record)
    },
  },
  {
    name: 'sum',
    minArity: 1,
    maxArity: 1,
    evaluateArgsToNodes: false,
    executor: (_context: RecordExpressionContext) => (nodeSet) => {
      if (!nodeSet) return 0
      if (Array.isArray(nodeSet)) return nodeSet.reduce((acc, value) => acc + (Number(value) || 0), 0)
      return 0
    },
  },
]
