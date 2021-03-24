import { Records } from '../records'
import { Nodes } from '../../node'
import { ExpressionFunction } from '../../expression'
import { RecordExpressionContext } from './context'
import { Objects } from '../../utils'
import { Surveys } from '../../survey'

export const recordExpressionFunctions: Array<ExpressionFunction<RecordExpressionContext>> = [
  {
    name: 'categoryItemProp',
    minArity: 3,
    executor: (context: RecordExpressionContext) => (
      categoryName: string,
      itemPropName: string,
      ...codePaths: string[]
    ) => {
      const { survey } = context
      const category = survey.categories
        ? Object.values(survey.categories).find((category) => category.props.name === categoryName)
        : null
      if (!category) return null

      const categoryItem = Surveys.getCategoryItemByCodePaths({ survey, categoryUuid: category.uuid, codePaths })
      if (!categoryItem) return null

      const extraProp = categoryItem.props.extra?.[itemPropName]
      return Objects.isEmpty(extraProp) ? null : extraProp
    },
  },
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
