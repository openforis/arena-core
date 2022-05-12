import { Objects } from './_objects'

describe('Objects', () => {
  test('Objects.isEqual', () => {
    const o1 = { a: 1, b: '2' }
    const o2 = { a: 1, b: '2' }
    expect(Objects.isEqual(o1, o2)).toBeTruthy()
  })
})
