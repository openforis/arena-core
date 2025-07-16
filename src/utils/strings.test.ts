import { Strings } from './strings'

describe('Strings', () => {
  test('unquote (empty string)', () => {
    const value = ''
    const result = Strings.unquote(value)
    expect(result).toEqual(value)
  })
  test('unquote (wrong string, only prefix)', () => {
    const value = `'a`
    const result = Strings.unquote(value)
    expect(result).toEqual(value)
  })
  test('unquote (wrong string, only suffix)', () => {
    const value = `a'`
    const result = Strings.unquote(value)
    expect(result).toEqual(value)
  })
  test('unquote (simple value)', () => {
    const value = `'test'`
    const result = Strings.unquote(value)
    expect(result).toEqual('test')
  })
  test('unquote double (simple value)', () => {
    const value = `"test"`
    const result = Strings.unquoteDouble(value)
    expect(result).toEqual('test')
  })
})
