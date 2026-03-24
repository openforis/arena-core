import { Versions } from './versions'

describe('Versions', () => {
  describe('parse', () => {
    it('parses "2.3.1"', () => {
      expect(Versions.parse('2.3.1')).toEqual({ major: 2, minor: 3, patch: 1 })
    })

    it('parses "v2.3.1" (v-prefixed)', () => {
      expect(Versions.parse('v2.3.1')).toEqual({ major: 2, minor: 3, patch: 1 })
    })

    it('parses "0.0.0"', () => {
      expect(Versions.parse('0.0.0')).toEqual({ major: 0, minor: 0, patch: 0 })
    })

    it('parses "2.3" (no patch, defaults to 0)', () => {
      expect(Versions.parse('2.3')).toEqual({ major: 2, minor: 3, patch: 0 })
    })

    it('parses "v2.3" (v-prefixed, no patch)', () => {
      expect(Versions.parse('v2.3')).toEqual({ major: 2, minor: 3, patch: 0 })
    })

    it('throws on invalid format', () => {
      expect(() => Versions.parse('abc')).toThrow()
      expect(() => Versions.parse('')).toThrow()
      expect(() => Versions.parse('1')).toThrow()
    })
  })

  describe('compare', () => {
    it('returns 0 for equal versions', () => {
      expect(Versions.compare('1.2.3', '1.2.3')).toBe(0)
      expect(Versions.compare('v1.2.3', '1.2.3')).toBe(0)
    })

    it('returns -1 when v1 < v2 (major)', () => {
      expect(Versions.compare('1.0.0', '2.0.0')).toBe(-1)
    })

    it('returns 1 when v1 > v2 (major)', () => {
      expect(Versions.compare('3.0.0', '2.9.9')).toBe(1)
    })

    it('returns -1 when v1 < v2 (minor)', () => {
      expect(Versions.compare('1.2.0', '1.3.0')).toBe(-1)
    })

    it('returns -1 when v1 < v2 (patch)', () => {
      expect(Versions.compare('1.2.3', '1.2.4')).toBe(-1)
    })
  })

  describe('isEqual', () => {
    it('returns true for equal versions', () => {
      expect(Versions.isEqual('2.3.1', 'v2.3.1')).toBe(true)
    })

    it('returns false for different versions', () => {
      expect(Versions.isEqual('2.3.1', '2.3.2')).toBe(false)
    })
  })

  describe('isGreaterThan', () => {
    it('returns true when v1 > v2', () => {
      expect(Versions.isGreaterThan('2.3.2', '2.3.1')).toBe(true)
    })

    it('returns false when v1 <= v2', () => {
      expect(Versions.isGreaterThan('2.3.1', '2.3.1')).toBe(false)
      expect(Versions.isGreaterThan('2.3.0', '2.3.1')).toBe(false)
    })
  })

  describe('isLessThan', () => {
    it('returns true when v1 < v2', () => {
      expect(Versions.isLessThan('1.9.9', '2.0.0')).toBe(true)
    })

    it('returns false when v1 >= v2', () => {
      expect(Versions.isLessThan('2.0.0', '2.0.0')).toBe(false)
      expect(Versions.isLessThan('2.0.1', '2.0.0')).toBe(false)
    })
  })

  describe('isGreaterThanOrEqual / isLessThanOrEqual', () => {
    it('isGreaterThanOrEqual handles equal and greater', () => {
      expect(Versions.isGreaterThanOrEqual('1.0.0', '1.0.0')).toBe(true)
      expect(Versions.isGreaterThanOrEqual('1.0.1', '1.0.0')).toBe(true)
      expect(Versions.isGreaterThanOrEqual('0.9.9', '1.0.0')).toBe(false)
    })

    it('isLessThanOrEqual handles equal and lesser', () => {
      expect(Versions.isLessThanOrEqual('1.0.0', '1.0.0')).toBe(true)
      expect(Versions.isLessThanOrEqual('0.9.9', '1.0.0')).toBe(true)
      expect(Versions.isLessThanOrEqual('1.0.1', '1.0.0')).toBe(false)
    })
  })
})
