import { SRSs } from './srss'

beforeAll(SRSs.init)

describe('SRSs', () => {
  test('SRSs.getSRSByCode', async () => {
    const srs = SRSs.getSRSByCode('4326')
    expect(srs).toBeDefined()
    expect(srs?.name).toBe('GCS WGS 1984')
  })
})
