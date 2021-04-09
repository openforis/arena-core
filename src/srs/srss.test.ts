import { SRSs } from './srss'

beforeAll(SRSs.init)

describe('SRSs', () => {
  test('SRSs.getSRSByCode', () => {
    const srs = SRSs.getSRSByCode('4326')
    expect(srs).toBeDefined()
    expect(srs?.name).toBe('GCS WGS 1984')
  })
  test('SRSs.findSRSByCodeOrName (1 item)', () => {
    const srss = SRSs.findSRSByCodeOrName('4326')
    expect(srss.length).toBe(1)
    const srs = srss[0]
    expect(srs.code).toBe('4326')
    expect(srs.name).toBe('GCS WGS 1984')
  })
  test('SRSs.findSRSByCodeOrName (no items found)', () => {
    const srss = SRSs.findSRSByCodeOrName('9999')
    expect(srss.length).toBe(0)
  })
  test('SRSs.findSRSByCodeOrName (multiple items, sorted by name)', () => {
    const srss = SRSs.findSRSByCodeOrName('gcs')
    expect(srss.length).toBe(200)
  })
  test('SRSs.findSRSByCodeOrName (multiple items, limited)', () => {
    const srss = SRSs.findSRSByCodeOrName('gcs', 10)
    expect(srss.length).toBe(10)
  })
  test('SRSs.findSRSByCodeOrName (multiple items, sorted by name)', () => {
    const srss = SRSs.findSRSByCodeOrName('gcs australian')
    expect(srss.length).toBe(4)
    expect(srss.map((srs) => srs.name)).toStrictEqual([
      'GCS Australian',
      'GCS Australian 1966',
      'GCS Australian 1984',
      'GCS Australian Antarctic 1998',
    ])
  })
})
