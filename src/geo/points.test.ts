import { PointFactory } from './pointFactory'
import { Points } from './points'

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
})
