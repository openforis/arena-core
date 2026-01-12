import { Users } from '../auth'
import { CategoryItem } from '../category'
import { SystemError } from '../error'
import { ExpressionFunctions } from '../expression'
import { ExtraProps } from '../extraProp/extraProps'
import { Point, Points } from '../geo'
import { LanguagesISO639part2 } from '../language'
import { Record } from '../record'
import { getNodeDefParent } from '../survey/surveys/nodeDefs'
import { getCategoryItemByCodePaths, getTaxonByCode } from '../survey/surveys/refsData'
import { getCategoryByName, getSRSIndex, getTaxonomyByName } from '../survey/surveys/surveysGetters'
import { Taxon } from '../taxonomy'
import { Dates, Objects } from '../utils'
import { NodeDefExpressionContext } from './context'

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

const isUsingDraftProps = (context: NodeDefExpressionContext) => {
  // use draft props when validating expression or previewing record
  const record: Record = (context as any).record
  return !record || !!record.preview
}

const getOrFetchCategoryItem = async (params: {
  context: NodeDefExpressionContext
  categoryUuid: string
  codePaths: string[]
}): Promise<CategoryItem | undefined> => {
  const { context, categoryUuid, codePaths } = params
  // if any code path is empty, return null (no category item can be found)
  if (Objects.isEmpty(codePaths) || codePaths.some(Objects.isEmpty)) {
    return undefined
  }
  const { survey, categoryItemProvider } = context
  const categoryItem = getCategoryItemByCodePaths({ survey, categoryUuid, codePaths })
  const draft = isUsingDraftProps(context)
  return categoryItem ?? categoryItemProvider?.getItemByCodePaths({ survey, categoryUuid, codePaths, draft })
}

const getOrFetchTaxon = async (params: {
  context: NodeDefExpressionContext
  taxonomyUuid: string
  taxonCode: string
}): Promise<Taxon | undefined> => {
  const { context, taxonomyUuid, taxonCode } = params
  if (typeof taxonCode !== 'string' && typeof taxonCode !== 'number') {
    return undefined // node def expression validator could call it passing a node def object
  }
  // if taxonCode is empty, return undefined
  if (Objects.isEmpty(taxonCode)) {
    return undefined
  }
  const { survey, taxonProvider } = context
  const taxon = getTaxonByCode({ survey, taxonomyUuid, taxonCode })
  // fetch draft props when validating expression or previewing record
  const record: Record = (context as any).record
  const draft = !record || !!record.preview
  return taxon ?? taxonProvider?.getTaxonByCode({ survey, taxonomyUuid, taxonCode, draft })
}

export const nodeDefExpressionFunctions: ExpressionFunctions<NodeDefExpressionContext> = {
  categoryItemProp: {
    minArity: 3,
    executor:
      (context: NodeDefExpressionContext) =>
      async (categoryName: string, itemPropName: string, ...codePaths: string[]): Promise<any> => {
        const { survey } = context

        if (Objects.isEmpty(categoryName) || Objects.isEmpty(itemPropName) || Objects.isEmpty(codePaths))
          throw new SystemError('expression.missingFunctionParameters')

        if (codePaths.some(Objects.isEmpty)) {
          return null
        }
        const category = getCategoryByName({ survey, categoryName })
        if (!category) throw new SystemError('expression.invalidCategoryName', { name: categoryName })

        const extraPropDef = category.props.itemExtraDef?.[itemPropName]
        if (!extraPropDef) throw new SystemError('expression.invalidCategoryExtraProp', { propName: itemPropName })

        const { uuid: categoryUuid } = category
        const categoryItem = await getOrFetchCategoryItem({ context, categoryUuid, codePaths })
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
        if (Objects.isEmpty(taxonomyName) || Objects.isEmpty(propName))
          throw new SystemError('expression.missingFunctionParameters')
        if (Objects.isEmpty(taxonCode)) return null

        const { survey } = context
        const taxonomy = getTaxonomyByName({ survey, taxonomyName })
        if (!taxonomy) throw new SystemError('expression.invalidTaxonomyName', { name: taxonomyName })

        const extraPropDef = taxonomy.props.extraPropsDefs?.[propName]
        if (!extraPropDef) throw new SystemError('expression.invalidTaxonomyExtraProp', { propName })

        const taxon = await getOrFetchTaxon({ context, taxonomyUuid: taxonomy.uuid, taxonCode })
        if (!taxon) return null

        const value = taxon.props.extra?.[propName]
        return ExtraProps.convertValue({ survey, extraPropDef, value })
      },
  },
  taxonVernacularName: {
    minArity: 3,
    maxArity: 3,
    executor:
      (context: NodeDefExpressionContext) =>
      async (taxonomyName: string, vernacularLangCode: string, taxonCode: string) => {
        if (Objects.isEmpty(taxonomyName) || Objects.isEmpty(vernacularLangCode))
          throw new SystemError('expression.missingFunctionParameters')
        if (Objects.isEmpty(taxonCode)) return null

        const { survey } = context
        const taxonomy = getTaxonomyByName({ survey, taxonomyName })
        if (!taxonomy) throw new SystemError('expression.invalidTaxonomyName', { name: taxonomyName })

        if (!LanguagesISO639part2[vernacularLangCode]) {
          throw new SystemError('expression.invalidTaxonVernacularNameLanguageCode', { vernacularLangCode })
        }

        const taxon = await getOrFetchTaxon({ context, taxonomyUuid: taxonomy.uuid, taxonCode })
        if (!taxon) return null

        const vernacularNameArray = taxon.vernacularNames?.[vernacularLangCode]
        // consider first vernacular name object only
        const firstVernacularName = vernacularNameArray?.[0]
        return firstVernacularName?.props?.name
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
