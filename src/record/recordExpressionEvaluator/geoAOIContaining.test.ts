import { beforeAll, describe, expect, test } from '@jest/globals'

import { AreaOfInterest } from '../../geo'
import { AreaOfInterestProvider } from '../../nodeDefExpressionEvaluator'
import { Survey } from '../../survey'
import { createTestAreaOfInterestProvider, withAreasOfInterest } from '../../tests/areaOfInterestTestUtils'
import { createTestAdminUser, createTestRecord, createTestSurvey } from '../../tests/data'
import { ArenaRecord } from '../record'
import { Records } from '../records'
import { RecordExpressionContext } from './context'
import { RecordExpressionEvaluator } from './recordExpressionEvaluator'

const polygon = (west: number, east: number): AreaOfInterest => ({
  type: 'Polygon',
  coordinates: [
    [
      [west, 12.4],
      [east, 12.4],
      [east, 12.6],
      [west, 12.6],
      [west, 12.4],
    ],
  ],
})

// both contain cluster_location (lon 41.88, lat 12.49): they overlap
const westArea = polygon(41.8, 41.95)
const square = polygon(41.8, 42.0)
const areaOfInterestProvider = createTestAreaOfInterestProvider({ west: westArea, square })

const user = createTestAdminUser()
let survey: Survey
let record: ArenaRecord

const evaluate = (expression: string, params: { survey: Survey; provider?: AreaOfInterestProvider | null }) => {
  const { survey: surveyToEvaluate, provider = areaOfInterestProvider } = params
  const nodeContext = Records.getRoot(record)!
  const context: RecordExpressionContext = {
    user,
    survey: surveyToEvaluate,
    record,
    nodeContext,
    nodeCurrent: nodeContext,
    object: nodeContext,
    areaOfInterestProvider: provider ?? undefined,
  }
  return new RecordExpressionEvaluator().evaluate(expression, context)
}

describe('geoAOIContaining', () => {
  beforeAll(async () => {
    survey = await createTestSurvey({ user })
    record = createTestRecord({ user, survey })
  }, 10000)

  test('first area (in the survey order) containing the coordinate', async () => {
    const surveyWestFirst = withAreasOfInterest(survey, ['west', 'square'])
    expect(await evaluate('geoAOIContaining(cluster_location)', { survey: surveyWestFirst })).toBe('west')
    const surveySquareFirst = withAreasOfInterest(survey, ['square', 'west'])
    expect(await evaluate('geoAOIContaining(cluster_location)', { survey: surveySquareFirst })).toBe('square')
  })

  test('no area containing the coordinate => null', async () => {
    const surveyWithAreas = withAreasOfInterest(survey, ['west', 'square'])
    expect(await evaluate('geoAOIContaining(plot[2].plot_location)', { survey: surveyWithAreas })).toBeNull()
  })

  test('area without geometry available is skipped', async () => {
    const surveyWithAreas = withAreasOfInterest(survey, ['missing', 'square'])
    expect(await evaluate('geoAOIContaining(cluster_location)', { survey: surveyWithAreas })).toBe('square')
  })

  test('provider missing => null', async () => {
    const surveyWithAreas = withAreasOfInterest(survey, ['west'])
    expect(await evaluate('geoAOIContaining(cluster_location)', { survey: surveyWithAreas, provider: null })).toBeNull()
  })

  test('not a coordinate => null', async () => {
    const surveyWithAreas = withAreasOfInterest(survey, ['west'])
    expect(await evaluate('geoAOIContaining(remarks)', { survey: surveyWithAreas })).toBeNull()
  })
})
