import { Nodes } from '../../node'
import { ExpressionFunction } from '../../expression'
import { Records } from '../records'
import { RecordExpressionContext } from './context'

export const recordExpressionFunctions: Array<ExpressionFunction<RecordExpressionContext>> = [
  {
    name: 'index',
    minArity: 1,
    maxArity: 1,
    executor: (context: RecordExpressionContext) => (node) => {
      if (!node) {
        return -1
      }
      if (Nodes.isRoot(node)) {
        return 0
      }
      const { record } = context
      const parentNode = Records.getParent({ record, node })
      if (!parentNode) {
        return -1
      }
      const children = Records.getChildren({ record, parentNode, childDefUuid: node.nodeDefUuid })
      return children.findIndex((n) => n === node)
    },
  },
  {
    name: 'parent',
    minArity: 1,
    maxArity: 1,
    evaluateToNode: true,
    executor: (context: RecordExpressionContext) => (node) => {
      if (!node || Nodes.isRoot(node)) {
        return null
      }
      const { record } = context
      return Records.getParent({ record, node })
    },
  },
]
