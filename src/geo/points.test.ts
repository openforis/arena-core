import { describe, test, expect } from '@jest/globals'

import { PointFactory } from './pointFactory'
import { Points } from './points'
import { DEFAULT_SRS_INDEX } from '../srs'
import { Point } from './point'

// Helper function to test bearing between points
const testBearing = (origin: Point, distanceMeters: number, expectedBearing: number) => {
  const location = Points.pointAtDistance({
    origin,
    distanceMeters,
    bearingDeg: expectedBearing,
    srsIndex: DEFAULT_SRS_INDEX,
  })

  expect(location).not.toBeNull()
  if (location) {
    const actualBearing = Points.bearing(origin, location, DEFAULT_SRS_INDEX)
    expect(actualBearing).not.toBeNull()
    expect(actualBearing).toBeCloseTo(expectedBearing, 0)
  }
}

describe('Points test', () => {
  test('parsing incomplete coordinate (missing srs)', () => {
    const parsed = Points.parse('POINT(144.50234 -6.321367)')
    expect(parsed).toBeNull()
  })
  test('parsing incomplete coordinate (missing point)', () => {
    const parsed = Points.parse('SRID=EPSG')
    expect(parsed).toBeNull()
  })
  test('parsing valid coordinate', () => {
    const parsed = Points.parse('SRID=EPSG:4326;POINT(144.50234 -6.321367)')
    const expectedPoint = PointFactory.createInstance({ x: 144.50234, y: -6.321367 })
    expect(parsed).toStrictEqual(expectedPoint)
  })
  test('parsing valid coordinate (srs id without EPSG prefix)', () => {
    const parsed = Points.parse('SRID=4326;POINT(144.50234 -6.321367)')
    const expectedPoint = PointFactory.createInstance({ x: 144.50234, y: -6.321367 })
    expect(parsed).toStrictEqual(expectedPoint)
  })
  test('parse and toString roundtrip', () => {
    const pointString = 'SRID=4326;POINT(144.50234 -6.321367)'
    const parsed = Points.parse(pointString)
    expect(parsed).toBeDefined()
    if (parsed) {
      const parsedToString = Points.toString(parsed)
      expect(parsedToString).toBe(pointString)
    }
  })
  test('validate valid coordinate', () => {
    const point = PointFactory.createInstance({ x: 144.50234, y: -6.321367 })
    const valid = Points.isValid(point)
    expect(valid).toBeTruthy()
  })
  test('validate invalid coordinate (invalid srs)', () => {
    const point = PointFactory.createInstance({ srs: '9999', x: 144.50234, y: -6.321367 })
    const valid = Points.isValid(point)
    expect(valid).toBeFalsy()
  })
  test('validate invalid coordinate (invalid x)', () => {
    const point = PointFactory.createInstance({ x: 244.50234, y: -6.321367 })
    const valid = Points.isValid(point)
    expect(valid).toBeFalsy()
  })
  test('validate invalid coordinate (invalid y)', () => {
    const point = PointFactory.createInstance({ x: 144.50234, y: -96.321367 })
    const valid = Points.isValid(point)
    expect(valid).toBeFalsy()
  })

  test('location at distance', () => {
    const origin = PointFactory.createInstance({ x: 12, y: 41 })
    const distanceMeters = 1000

    const location = Points.pointAtDistance({ origin, distanceMeters, bearingDeg: 90, srsIndex: DEFAULT_SRS_INDEX })

    expect(location).not.toBeNull()
    if (location) {
      const actualDistance = Points.distance(origin, location, DEFAULT_SRS_INDEX)
      expect(actualDistance).toBeCloseTo(distanceMeters, 0)
    }
  })

  test.each([
    { direction: 'east', bearingDeg: 90 },
    { direction: 'north', bearingDeg: 0 },
    { direction: 'south', bearingDeg: 180 },
    { direction: 'west', bearingDeg: 270 },
  ])('bearing between points - $direction direction', ({ bearingDeg }) => {
    const origin = PointFactory.createInstance({ x: 12, y: 41 })
    testBearing(origin, 1000, bearingDeg)
  })
})

describe('Points.transform', () => {
  const utm33N = {
    code: '32633',
    name: 'WGS 84 / UTM zone 33N',
    wkt: 'PROJCS["WGS 84 / UTM zone 33N",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",15],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["metre",1]]',
  }
  const srsIndex = { ...DEFAULT_SRS_INDEX, [utm33N.code]: utm33N }

  test('transforms a point into another SRS and back (repeated calls give the same result)', () => {
    const point = PointFactory.createInstance({ x: 12.5, y: 41.9 })
    for (let i = 0; i < 3; i++) {
      const transformed = Points.transform(point, utm33N.code, srsIndex)
      expect(transformed?.srs).toBe(utm33N.code)
      expect(transformed?.x).toBeCloseTo(292_765, -3)
      expect(transformed?.y).toBeCloseTo(4_641_570, -3)

      const transformedBack = Points.transform(transformed!, '4326', srsIndex)
      expect(transformedBack?.x).toBeCloseTo(12.5, 6)
      expect(transformedBack?.y).toBeCloseTo(41.9, 6)
    }
  })

  test('returns null for an unknown SRS', () => {
    const point = PointFactory.createInstance({ x: 12.5, y: 41.9 })
    expect(Points.transform(point, '99999', srsIndex)).toBeNull()
  })
})
