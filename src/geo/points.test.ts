import { SRSs } from '../srs'
import { PointFactory } from './pointFactory'
import { Points } from './points'

describe('Points test', () => {
  beforeAll(SRSs.init)

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
    const expectedPoint = PointFactory.createInstance({ srs: '4326', x: 144.50234, y: -6.321367 })
    expect(parsed).toStrictEqual(expectedPoint)
  })
  test('parsing valid coordinate (srs id without EPSG prefix)', () => {
    const parsed = Points.parse('SRID=4326;POINT(144.50234 -6.321367)')
    const expectedPoint = PointFactory.createInstance({ srs: '4326', x: 144.50234, y: -6.321367 })
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
  test('validate valid coordinate', async () => {
    const point = PointFactory.createInstance({ srs: '4326', x: 144.50234, y: -6.321367 })
    const valid = await Points.isValid(point)
    expect(valid).toBeTruthy()
  })
  test('validate invalid coordinate (invalid srs)', async () => {
    const point = PointFactory.createInstance({ srs: '99999', x: 144.50234, y: -6.321367 })
    const valid = await Points.isValid(point)
    expect(valid).toBeFalsy()
  })
  test('validate invalid coordinate (invalid x)', async () => {
    const point = PointFactory.createInstance({ srs: '4326', x: 244.50234, y: -6.321367 })
    const valid = await Points.isValid(point)
    expect(valid).toBeFalsy()
  })
  test('validate invalid coordinate (invalid y)', async () => {
    const point = PointFactory.createInstance({ srs: '4326', x: 144.50234, y: -96.321367 })
    const valid = await Points.isValid(point)
    expect(valid).toBeFalsy()
  })
})
