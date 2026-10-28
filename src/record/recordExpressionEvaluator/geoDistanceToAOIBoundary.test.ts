import { beforeAll, describe, expect, test } from '@jest/globals'

import { SystemError } from '../../error'
import { AreaOfInterest } from '../../geo'
import { DEFAULT_SRS } from '../../srs'
import { Survey } from '../../survey'
import { createTestAdminUser, createTestRecord, createTestSurvey } from '../../tests/data'
import { TestUtils } from '../../tests/testUtils'
import { ArenaRecord } from '../record'
import { Records } from '../records'
import { RecordExpressionContext } from './context'
import { RecordExpressionEvaluator } from './recordExpressionEvaluator'

// square around the test record locations (lon 41.8..42.0, lat 12.4..12.6)
const areaOfInterest: AreaOfInterest = {
  type: 'Polygon',
  coordinates: [
    [
      [41.8, 12.4],
      [42.0, 12.4],
      [42.0, 12.6],
      [41.8, 12.6],
      [41.8, 12.4],
    ],
  ],
}

const user = createTestAdminUser()
let surveyWithAOI: Survey
let surveyWithoutAOI: Survey
let record: ArenaRecord

const evaluate = (expression: string, params: { survey?: Survey; record?: ArenaRecord } = {}) => {
  const { survey = surveyWithAOI, record: recordToEvaluate = record } = params
  const nodeContext = Records.getRoot(recordToEvaluate)!
  const context: RecordExpressionContext = {
    user,
    survey,
    record: recordToEvaluate,
    nodeContext,
    nodeCurrent: nodeContext,
    object: nodeContext,
  }
  return new RecordExpressionEvaluator().evaluate(expression, context)
}

// record with cluster_location ~11 m inside the west boundary of the area of interest, with the specified accuracy
const createRecordNearBoundary = (accuracy: number): ArenaRecord => {
  const node = TestUtils.getNodeByPath({ survey: surveyWithAOI, record, path: 'cluster.cluster_location' })
  const nodeUpdated = { ...node, value: { srs: DEFAULT_SRS.code, x: 41.8001, y: 12.5, accuracy } }
  return { ...record, nodes: { ...record.nodes, [node.uuid]: nodeUpdated } }
}

describe('geoDistanceToAOIBoundary', () => {
  beforeAll(async () => {
    surveyWithoutAOI = await createTestSurvey({ user })
    surveyWithAOI = { ...surveyWithoutAOI, props: { ...surveyWithoutAOI.props, areaOfInterest } }
    record = createTestRecord({ user, survey: surveyWithAOI })
  }, 10000)

  test('coordinate inside => negative distance to the nearest boundary', async () => {
    // nearest boundary: lon 41.8 (0.083 degrees of longitude at lat 12.49 ≈ 9 km)
    const distance = await evaluate('geoDistanceToAOIBoundary(cluster_location)')
    expect(distance).toBeLessThan(-8900)
    expect(distance).toBeGreaterThan(-9100)
  })

  test('coordinate outside => positive distance', async () => {
    // ≈ 0.3 degrees of latitude north of lat 12.6 ≈ 33 km
    const distance = await evaluate('geoDistanceToAOIBoundary(plot[2].plot_location)')
    expect(distance).toBeGreaterThan(32_900)
    expect(distance).toBeLessThan(33_400)
  })

  test('point specified as string', async () => {
    expect(await evaluate(`geoDistanceToAOIBoundary('SRID=EPSG:4326;POINT(41.9 12.5)')`)).toBeLessThan(0)
  })

  test('comparison with the location accuracy', async () => {
    const inside = 'geoDistanceToAOIBoundary(cluster_location) < -cluster_location.accuracy'
    const uncertain = 'Math.abs(geoDistanceToAOIBoundary(cluster_location)) <= cluster_location.accuracy'

    const recordAccurate = createRecordNearBoundary(5)
    expect(await evaluate(inside, { record: recordAccurate })).toBe(true)
    expect(await evaluate(uncertain, { record: recordAccurate })).toBe(false)

    const recordNotAccurate = createRecordNearBoundary(20)
    expect(await evaluate(inside, { record: recordNotAccurate })).toBe(false)
    expect(await evaluate(uncertain, { record: recordNotAccurate })).toBe(true)
  })

  test('survey without area of interest => null', async () => {
    expect(await evaluate('geoDistanceToAOIBoundary(cluster_location)', { survey: surveyWithoutAOI })).toBeNull()
  })

  test('not a coordinate => null', async () => {
    expect(await evaluate('geoDistanceToAOIBoundary(remarks)')).toBeNull()
  })

  test('missing argument => error', async () => {
    await expect(evaluate('geoDistanceToAOIBoundary()')).rejects.toEqual(
      new SystemError('expression.functionHasTooFewArguments')
    )
  })
})
