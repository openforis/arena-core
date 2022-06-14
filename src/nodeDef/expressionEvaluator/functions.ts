import { ExpressionFunction } from '../../expression'
import { Objects } from '../../utils'
import { Surveys } from '../../survey'
import { Point, Points } from '../../geo'
import { Dates } from '../../utils/dates'
import { NodeDefExpressionContext } from './context'

export const nodeDefExpressionFunctions: ExpressionFunction<NodeDefExpressionContext>[] = [
  {
    name: 'categoryItemProp',
    minArity: 3,
    executor:
      (context: NodeDefExpressionContext) =>
      (categoryName: string, itemPropName: string, ...codePaths: string[]) => {
        const { survey } = context
        const category = Surveys.getCategoryByName({ survey, categoryName })
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
    executor:
      () =>
      (coordinateFrom: Point | string, coordinateTo: Point | string): number | null => {
        const toPoint = (coordinate: Point | string): Point | null =>
          coordinate && typeof coordinate === 'string' ? Points.parse(coordinate) : (coordinate as Point)
        const pointFrom = toPoint(coordinateFrom)
        const pointTo = toPoint(coordinateTo)

        return pointFrom && pointTo ? Points.distance(pointFrom, pointTo) : null
      },
  },
  {
    name: 'includes',
    minArity: 2,
    maxArity: 2,
    evaluateArgsToNodes: false,
    executor:
      () =>
      (items: any, value: any): boolean =>
        Array.isArray(items) && items.map(String).includes(String(value)),
  },
  {
    name: 'index',
    minArity: 1,
    maxArity: 1,
    evaluateArgsToNodes: true,
    executor: (_context: NodeDefExpressionContext) => () => {
      return -1
    },
  },
  {
    name: 'now',
    minArity: 0,
    maxArity: 0,
    evaluateToNode: false,
    executor: () => () => Dates.nowFormattedForExpression(),
  },
  {
    name: 'parent',
    minArity: 1,
    maxArity: 1,
    evaluateArgsToNodes: true,
    evaluateToNode: true,
    executor: (context: NodeDefExpressionContext) => (nodeDef) => {
      const { survey } = context
      return Surveys.getNodeDefParent({ survey, nodeDef })
    },
  },
  {
    name: 'taxonProp',
    minArity: 3,
    maxArity: 3,
    executor: (context: NodeDefExpressionContext) => (taxonomyName: string, propName: string, taxonCode: string) => {
      const { survey } = context
      const taxonomy = Surveys.getTaxonomyByName({ survey, taxonomyName })
      if (!taxonomy) return null

      const taxon = Surveys.getTaxonByCode({ survey, taxonomyUuid: taxonomy.uuid, taxonCode })
      if (!taxon) return null

      const extraProp = taxon.props.extra?.[propName]
      return Objects.isEmpty(extraProp) ? null : extraProp
    },
  },
]
