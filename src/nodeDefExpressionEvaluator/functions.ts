import { ExpressionFunctions } from '../expression'
import { Objects } from '../utils'
import { getCategoryByName, getSRSIndex, getTaxonomyByName } from '../survey/surveys/surveysGetters'
import { getNodeDefParent } from '../survey/surveys/nodeDefs'
import { getCategoryItemByCodePaths, getTaxonByCode } from '../survey/surveys/refsData'
import { Point, Points } from '../geo'
import { Dates } from '../utils/dates'
import { NodeDefExpressionContext } from './context'
import { SystemError } from '../error'
import { ExtraProps } from '../extraProp/extraProps'

const sampleGeoJsonPolygon = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [100.0, 0.0],
        [101.0, 0.0],
        [101.0, 1.0],
        [100.0, 1.0],
        [100.0, 0.0],
      ],
    ],
  },
}

export const nodeDefExpressionFunctions: ExpressionFunctions<NodeDefExpressionContext> = {
  categoryItemProp: {
    minArity: 3,
    executor:
      (context: NodeDefExpressionContext) =>
      (categoryName: string, itemPropName: string, ...codePaths: string[]) => {
        const { survey } = context

        if (Objects.isEmpty(categoryName) || Objects.isEmpty(itemPropName) || Objects.isEmpty(codePaths))
          throw new SystemError('expression.missingFunctionParameters')

        const category = getCategoryByName({ survey, categoryName })
        if (!category) throw new SystemError('expression.invalidCategoryName', { name: categoryName })

        const extraPropDef = category.props.itemExtraDef?.[itemPropName]
        if (!extraPropDef) throw new SystemError('expression.invalidCategoryExtraProp', { propName: itemPropName })

        const categoryItem = getCategoryItemByCodePaths({
          survey,
          categoryUuid: category.uuid,
          codePaths,
        })
        if (!categoryItem) return null

        const value = categoryItem.props.extra?.[itemPropName]
        return ExtraProps.convertValue({ survey, extraPropDef, value })
      },
  },
  count: {
    minArity: 1,
    maxArity: 1,
    executor: (_context: NodeDefExpressionContext) => (_nodeSet) => 1,
  },
  distance: {
    minArity: 2,
    maxArity: 2,
    executor:
      (context: NodeDefExpressionContext) =>
      (coordinateFrom: Point | string, coordinateTo: Point | string): number | null => {
        const { survey } = context
        const srsIndex = getSRSIndex(survey)

        const pointFrom = Points.parse(coordinateFrom)
        const pointTo = Points.parse(coordinateTo)

        return pointFrom && pointTo ? Points.distance(pointFrom, pointTo, srsIndex) : null
      },
  },
  first: {
    minArity: 1,
    maxArity: 1,
    evaluateArgsToNodes: true,
    executor: (_context: NodeDefExpressionContext) => () => {
      return null
    },
  },
  geoPolygon: {
    minArity: 1,
    evaluateArgsToNodes: true,
    executor: () => () => sampleGeoJsonPolygon,
  },
  includes: {
    minArity: 2,
    maxArity: 2,
    evaluateArgsToNodes: false,
    executor:
      () =>
      (items: any, value: any): boolean =>
        Array.isArray(items) && items.map(String).includes(String(value)),
  },
  index: {
    minArity: 1,
    maxArity: 1,
    evaluateArgsToNodes: true,
    executor: () => () => {
      return -1
    },
  },
  last: {
    minArity: 1,
    maxArity: 1,
    evaluateArgsToNodes: true,
    executor: () => () => {
      return null
    },
  },
  now: {
    minArity: 0,
    maxArity: 0,
    evaluateToNode: false,
    executor: () => () => Dates.nowFormattedForStorage(),
  },
  parent: {
    minArity: 1,
    maxArity: 1,
    evaluateArgsToNodes: true,
    evaluateToNode: true,
    executor: (context: NodeDefExpressionContext) => (nodeDef) => {
      const { survey } = context
      return getNodeDefParent({ survey, nodeDef })
    },
  },
  sum: {
    minArity: 1,
    maxArity: 1,
    evaluateArgsToNodes: true,
    executor: (_context: NodeDefExpressionContext) => (_nodeSet) => {
      return 1
    },
  },
  taxonProp: {
    minArity: 3,
    maxArity: 3,
    executor: (context: NodeDefExpressionContext) => (taxonomyName: string, propName: string, taxonCode: string) => {
      const { survey } = context

      if (Objects.isEmpty(taxonomyName) || Objects.isEmpty(propName) || Objects.isEmpty(taxonCode))
        throw new SystemError('expression.missingFunctionParameters')

      const taxonomy = getTaxonomyByName({ survey, taxonomyName })
      if (!taxonomy) throw new SystemError('expression.invalidTaxonomyName', { name: taxonomyName })

      const extraPropDef = taxonomy.props.extraPropsDefs?.[propName]
      if (!extraPropDef) throw new SystemError('expression.invalidTaxonomyExtraProp', { propName })

      if (typeof taxonCode !== 'string') {
        return null // node def expression validator could call it passing a node def object
      }

      const taxon = getTaxonByCode({ survey, taxonomyUuid: taxonomy.uuid, taxonCode })
      if (!taxon) return null

      const value = taxon.props.extra?.[propName]
      return ExtraProps.convertValue({ survey, extraPropDef, value })
    },
  },
  userEmail: {
    minArity: 0,
    maxArity: 0,
    executor: (context: NodeDefExpressionContext) => () => context.user?.email,
  },
  userName: {
    minArity: 0,
    maxArity: 0,
    executor: (context: NodeDefExpressionContext) => () => context.user?.name,
  },
  userProp: {
    minArity: 1,
    maxArity: 1,
    executor: (context: NodeDefExpressionContext) => (propName: string) => context.user?.props.extra?.[propName],
  },
}
