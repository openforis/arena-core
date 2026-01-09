import { UniqueFileNamesGenerator } from './UniqueFileNamesGenerator'

describe('UniqueFileNamesGenerator', () => {
  let generator: UniqueFileNamesGenerator

  beforeEach(() => {
    generator = new UniqueFileNamesGenerator()
  })

  describe('generateUniqueFileName', () => {
    test('generates the same file name when used for the first time', () => {
      const fileName = generator.generateUniqueFileName('test.txt', 'key1')
      expect(fileName).toBe('test.txt')
    })

    test('returns the same file name for the same key', () => {
      const fileName1 = generator.generateUniqueFileName('test.txt', 'key1')
      const fileName2 = generator.generateUniqueFileName('test.txt', 'key1')

      expect(fileName1).toBe('test.txt')
      expect(fileName2).toBe('test.txt')
    })

    test('generates a unique file name when the same file name is used with a different key', () => {
      const fileName1 = generator.generateUniqueFileName('test.txt', 'key1')
      const fileName2 = generator.generateUniqueFileName('test.txt', 'key2')

      expect(fileName1).toBe('test.txt')
      expect(fileName2).toBe('test (1).txt')
    })

    test('generates incremental file names for multiple conflicts', () => {
      const fileName1 = generator.generateUniqueFileName('data.csv', 'key1')
      const fileName2 = generator.generateUniqueFileName('data.csv', 'key2')
      const fileName3 = generator.generateUniqueFileName('data.csv', 'key3')
      const fileName4 = generator.generateUniqueFileName('data.csv', 'key4')

      expect(fileName1).toBe('data.csv')
      expect(fileName2).toBe('data (1).csv')
      expect(fileName3).toBe('data (2).csv')
      expect(fileName4).toBe('data (3).csv')
    })

    test('handles file names without extension', () => {
      const fileName1 = generator.generateUniqueFileName('document', 'key1')
      const fileName2 = generator.generateUniqueFileName('document', 'key2')

      expect(fileName1).toBe('document')
      expect(fileName2).toBe('document (1)')
    })

    test('handles file names that already have an index', () => {
      const fileName1 = generator.generateUniqueFileName('report (1).pdf', 'key1')
      const fileName2 = generator.generateUniqueFileName('report (1).pdf', 'key2')
      const fileName3 = generator.generateUniqueFileName('report (1).pdf', 'key3')

      expect(fileName1).toBe('report (1).pdf')
      expect(fileName2).toBe('report (2).pdf')
      expect(fileName3).toBe('report (3).pdf')
    })

    test('maintains separate tracking for different base file names', () => {
      const fileNameA1 = generator.generateUniqueFileName('fileA.txt', 'keyA1')
      const fileNameB1 = generator.generateUniqueFileName('fileB.txt', 'keyB1')
      const fileNameA2 = generator.generateUniqueFileName('fileA.txt', 'keyA2')
      const fileNameB2 = generator.generateUniqueFileName('fileB.txt', 'keyB2')

      expect(fileNameA1).toBe('fileA.txt')
      expect(fileNameB1).toBe('fileB.txt')
      expect(fileNameA2).toBe('fileA (1).txt')
      expect(fileNameB2).toBe('fileB (1).txt')
    })

    test('handles complex file names with spaces and special characters', () => {
      const fileName1 = generator.generateUniqueFileName('my report 2024.pdf', 'key1')
      const fileName2 = generator.generateUniqueFileName('my report 2024.pdf', 'key2')

      expect(fileName1).toBe('my report 2024.pdf')
      expect(fileName2).toBe('my report 2024 (1).pdf')
    })

    test('returns cached file name when requesting with an existing key', () => {
      generator.generateUniqueFileName('file.txt', 'key1')
      generator.generateUniqueFileName('file.txt', 'key2')

      const fileName = generator.generateUniqueFileName('different.txt', 'key1')

      // Should return the originally generated file name for key1
      expect(fileName).toBe('file.txt')
    })
  })

  describe('generateNextFileName', () => {
    test('adds (1) to a file name without an index', () => {
      const nextFileName = (generator as any).generateNextFileName('test.txt')
      expect(nextFileName).toBe('test (1).txt')
    })

    test('increments the index for a file name with an existing index', () => {
      const nextFileName = (generator as any).generateNextFileName('test (1).txt')
      expect(nextFileName).toBe('test (2).txt')
    })

    test('handles large index numbers', () => {
      const nextFileName = (generator as any).generateNextFileName('file (99).csv')
      expect(nextFileName).toBe('file (100).csv')
    })

    test('works with files without extension', () => {
      const nextFileName = (generator as any).generateNextFileName('document')
      expect(nextFileName).toBe('document (1)')
    })

    test('increments index for files without extension', () => {
      const nextFileName = (generator as any).generateNextFileName('document (5)')
      expect(nextFileName).toBe('document (6)')
    })
  })

  describe('fileNamesByKey and keysByFileName getters', () => {
    test('fileNamesByKey returns correct mapping', () => {
      generator.generateUniqueFileName('file1.txt', 'key1')
      generator.generateUniqueFileName('file2.txt', 'key2')

      const mapping = generator.fileNamesByKey
      expect(mapping['key1']).toBe('file1.txt')
      expect(mapping['key2']).toBe('file2.txt')
    })

    test('keysByFileName returns correct mapping', () => {
      generator.generateUniqueFileName('file.txt', 'key1')
      generator.generateUniqueFileName('file.txt', 'key2')

      const mapping = generator.keysByFileName
      expect(mapping['file.txt']).toBe('key1')
      expect(mapping['file (1).txt']).toBe('key2')
    })

    test('mappings are updated correctly with multiple operations', () => {
      generator.generateUniqueFileName('data.csv', 'keyA')
      generator.generateUniqueFileName('data.csv', 'keyB')
      generator.generateUniqueFileName('data.csv', 'keyC')

      const fileNamesByKey = generator.fileNamesByKey
      const keysByFileName = generator.keysByFileName

      expect(Object.keys(fileNamesByKey).length).toBe(3)
      expect(Object.keys(keysByFileName).length).toBe(3)

      expect(fileNamesByKey['keyA']).toBe('data.csv')
      expect(fileNamesByKey['keyB']).toBe('data (1).csv')
      expect(fileNamesByKey['keyC']).toBe('data (2).csv')

      expect(keysByFileName['data.csv']).toBe('keyA')
      expect(keysByFileName['data (1).csv']).toBe('keyB')
      expect(keysByFileName['data (2).csv']).toBe('keyC')
    })
  })

  describe('edge cases', () => {
    test('handles empty string as file name', () => {
      const fileName = generator.generateUniqueFileName('', 'key1')
      expect(fileName).toBe('')
    })

    test('handles file names with multiple dots', () => {
      const fileName1 = generator.generateUniqueFileName('my.file.name.tar.gz', 'key1')
      const fileName2 = generator.generateUniqueFileName('my.file.name.tar.gz', 'key2')

      expect(fileName1).toBe('my.file.name.tar.gz')
      expect(fileName2).toBe('my.file.name.tar (1).gz')
    })
  })
})
