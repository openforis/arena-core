import { ExpressionFunction } from '../../expression'
import { NodeDefExpressionContext } from './context'
import { Surveys } from '../../survey'
import { NodeDef, NodeDefProps, NodeDefType } from '..'

export const nodeDefExpressionFunctions: Array<ExpressionFunction<NodeDefExpressionContext>> = [
  {
    name: 'parent',
    minArity: 1,
    maxArity: 1,
    evaluateToNode: true,
    executor: (context: NodeDefExpressionContext) => (nodeDef: NodeDef<NodeDefType, NodeDefProps>) => {
      const { survey } = context
      return Surveys.getNodeDefParent({ survey, nodeDef })
    },
  },
]
