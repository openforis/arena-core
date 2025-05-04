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
import { Users } from '../auth'

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

const isNotValidString = (value: string): boolean => Objects.isEmpty(value) || typeof value !== 'string'

const emptyExecutor = (_context: NodeDefExpressionContext) => async () => null

export const nodeDefExpressionFunctions: ExpressionFunctions<NodeDefExpressionContext> = {
  categoryItemProp: {
    minArity: 3,
    executor:
      (context: NodeDefExpressionContext) =>
      async (categoryName: string, itemPropName: string, ...codePaths: string[]): Promise<any> => {
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
    executor:
      (_context: NodeDefExpressionContext) =>
      async (_nodeSet): Promise<any> =>
        1,
  },
  dateTimeDiff: {
    minArity: 4,
    maxArity: 4,
    executor:
      (_context: NodeDefExpressionContext) =>
      async (date1: string, time1: string, date2: string, time2: string): Promise<number | null> => {
        if (isNotValidString(date1) || isNotValidString(time1) || isNotValidString(date2) || isNotValidString(time2))
          return null
        const [hours1, minutes1] = time1.split(':')
        const [hours2, minutes2] = time2.split(':')
        let dt1 = Dates.addHours(date1, Number(hours1))
        dt1 = Dates.addMinutes(dt1, Number(minutes1))
        let dt2 = Dates.addHours(date2, Number(hours2))
        dt2 = Dates.addMinutes(dt2, Number(minutes2))
        return Dates.diffInMinutes(dt1, dt2)
      },
  },
  distance: {
    minArity: 2,
    maxArity: 2,
    executor:
      (context: NodeDefExpressionContext) =>
      async (coordinateFrom: Point | string, coordinateTo: Point | string): Promise<number | null> => {
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
    executor: emptyExecutor,
  },
  geoPolygon: {
    minArity: 1,
    evaluateArgsToNodes: true,
    executor: () => async () => sampleGeoJsonPolygon,
  },
  includes: {
    minArity: 2,
    maxArity: 2,
    evaluateArgsToNodes: false,
    executor:
      () =>
      async (items: any, value: any): Promise<boolean> =>
        Array.isArray(items) && items.map(String).includes(String(value)),
  },
  index: {
    minArity: 1,
    maxArity: 1,
    evaluateArgsToNodes: true,
    executor: () => async () => -1,
  },
  last: {
    minArity: 1,
    maxArity: 1,
    evaluateArgsToNodes: true,
    executor: emptyExecutor,
  },
  now: {
    minArity: 0,
    maxArity: 0,
    evaluateToNode: false,
    executor: () => async () => Dates.nowFormattedForStorage(),
  },
  parent: {
    minArity: 1,
    maxArity: 1,
    evaluateArgsToNodes: true,
    evaluateToNode: true,
    executor: (context: NodeDefExpressionContext) => async (nodeDef) => {
      const { survey } = context
      return getNodeDefParent({ survey, nodeDef })
    },
  },
  recordCycle: {
    minArity: 0,
    maxArity: 0,
    executor: emptyExecutor,
  },
  recordDateCreated: {
    minArity: 0,
    maxArity: 0,
    executor: emptyExecutor,
  },
  recordDateLastModified: {
    minArity: 0,
    maxArity: 0,
    executor: emptyExecutor,
  },
  recordOwnerEmail: {
    minArity: 0,
    maxArity: 0,
    executor: emptyExecutor,
  },
  recordOwnerName: {
    minArity: 0,
    maxArity: 0,
    executor: emptyExecutor,
  },
  recordOwnerRole: {
    minArity: 0,
    maxArity: 0,
    executor: emptyExecutor,
  },
  sum: {
    minArity: 1,
    maxArity: 1,
    evaluateArgsToNodes: true,
    executor: (_context: NodeDefExpressionContext) => async (_nodeSet) => 1,
  },
  taxonProp: {
    minArity: 3,
    maxArity: 3,
    executor:
      (context: NodeDefExpressionContext) => async (taxonomyName: string, propName: string, taxonCode: string) => {
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
    executor: (context: NodeDefExpressionContext) => async () => context.user?.email,
  },
  userIsRecordOwner: {
    minArity: 0,
    maxArity: 0,
    executor: (_context: NodeDefExpressionContext) => async () => false,
  },
  userName: {
    minArity: 0,
    maxArity: 0,
    executor: (context: NodeDefExpressionContext) => async () => context.user?.name,
  },
  userProp: {
    minArity: 1,
    maxArity: 1,
    executor: (context: NodeDefExpressionContext) => async (propName: string) => {
      const { user, survey } = context
      if (!survey || !user) return undefined
      const { uuid: surveyUuid } = survey
      const combinedExtraProps = Users.getCombinedExtraProps(surveyUuid)(user)
      return combinedExtraProps[propName]
    },
  },
}
