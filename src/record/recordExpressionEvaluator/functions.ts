import { Records } from '../records'
import { Node, Nodes } from '../../node'
import { ExpressionFunction } from '../../expression'
import { RecordExpressionContext } from './context'
import { Objects } from '../../utils'
import { Surveys } from '../../survey'
import { Point, Points } from '../../geo'

export const recordExpressionFunctions: Array<ExpressionFunction<RecordExpressionContext>> = [
  {
    name: 'categoryItemProp',
    minArity: 3,
    executor: (context: RecordExpressionContext) => async (
      categoryName: string,
      itemPropName: string,
      ...codePaths: string[]
    ): Promise<any | null> => {
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
    name: 'distance',
    minArity: 2,
    maxArity: 2,
    executor: () => async (coordinateFrom: Point | string, coordinateTo: Point | string): Promise<number | null> => {
      const toPoint = (coordinate: Point | string): Point | null =>
        coordinate && typeof coordinate === 'string' ? Points.parse(coordinate) : (coordinate as Point)
      const pointFrom = toPoint(coordinateFrom)
      const pointTo = toPoint(coordinateTo)
      if (pointFrom && pointTo) {
        return Points.distance(pointFrom, pointTo)
      }
      return null
    },
  },
  {
    name: 'index',
    minArity: 1,
    maxArity: 1,
    executor: (context: RecordExpressionContext) => async (node): Promise<number> => {
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
    executor: (context: RecordExpressionContext) => async (node): Promise<Node | undefined> => {
      if (!node || Nodes.isRoot(node)) {
        return undefined
      }
      const { record } = context
      return Records.getParent({ record, node })
    },
  },
]
