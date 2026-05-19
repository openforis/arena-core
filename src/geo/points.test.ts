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
    const normalizedBearing = (actualBearing! + 360) % 360
    const normalizedExpected = (expectedBearing + 360) % 360
    expect(normalizedBearing).toBeCloseTo(normalizedExpected, 0)
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

  test('bearing between points - east direction', () => {
    const origin = PointFactory.createInstance({ x: 12, y: 41 })
    testBearing(origin, 1000, 90)
  })

  test('bearing between points - north direction', () => {
    const origin = PointFactory.createInstance({ x: 12, y: 41 })
    testBearing(origin, 1000, 0)
  })

  test('bearing between points - south direction', () => {
    const origin = PointFactory.createInstance({ x: 12, y: 41 })
    testBearing(origin, 1000, 180)
  })

  test('bearing between points - west direction', () => {
    const origin = PointFactory.createInstance({ x: 12, y: 41 })
    testBearing(origin, 1000, 270)
  })
})
