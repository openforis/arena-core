import { UniqueFileNamesGenerator } from './UniqueFileNamesGenerator'

describe('UniqueFileNamesGenerator', () => {
  let generator: UniqueFileNamesGenerator

  beforeEach(() => {
    generator = new UniqueFileNamesGenerator()
  })

  const generateSequentialFileNames = (baseFileName: string, count: number): string[] => {
    return Array.from({ length: count }, (_, i) => generator.generateUniqueFileName(baseFileName, `key${i + 1}`))
  }

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

    test.each([
      ['test.txt', ['test.txt', 'test (1).txt']],
      ['document', ['document', 'document (1)']],
      ['my report 2024.pdf', ['my report 2024.pdf', 'my report 2024 (1).pdf']],
      ['my.file.name.tar.gz', ['my.file.name.tar.gz', 'my.file.name.tar (1).gz']],
    ])('generates unique file names for "%s"', (baseFileName, expected) => {
      const results = generateSequentialFileNames(baseFileName, expected.length)
      expect(results).toEqual(expected)
    })

    test('generates incremental file names for multiple conflicts', () => {
      const results = generateSequentialFileNames('data.csv', 4)
      expect(results).toEqual(['data.csv', 'data (1).csv', 'data (2).csv', 'data (3).csv'])
    })

    test('handles file names that already have an index', () => {
      const results = generateSequentialFileNames('report (1).pdf', 3)
      expect(results).toEqual(['report (1).pdf', 'report (2).pdf', 'report (3).pdf'])
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

    test('returns cached file name when requesting with an existing key', () => {
      generator.generateUniqueFileName('file.txt', 'key1')
      generator.generateUniqueFileName('file.txt', 'key2')

      const fileName = generator.generateUniqueFileName('different.txt', 'key1')

      expect(fileName).toBe('file.txt')
    })

    test('handles empty string as file name', () => {
      const fileName = generator.generateUniqueFileName('', 'key1')
      expect(fileName).toBe('')
    })
  })

  describe('fileNamesByKey and keysByFileName getters', () => {
    test('fileNamesByKey returns correct mapping', () => {
      generator.generateUniqueFileName('file1.txt', 'key1')
      generator.generateUniqueFileName('file2.txt', 'key2')

      const mapping = generator.fileNamesByKey
      expect(mapping).toMatchObject({
        key1: 'file1.txt',
        key2: 'file2.txt',
      })
    })

    test('keysByFileName returns correct mapping', () => {
      generator.generateUniqueFileName('file.txt', 'key1')
      generator.generateUniqueFileName('file.txt', 'key2')

      const mapping = generator.keysByFileName
      expect(mapping).toMatchObject({
        'file.txt': 'key1',
        'file (1).txt': 'key2',
      })
    })

    test('mappings are updated correctly with multiple operations', () => {
      generateSequentialFileNames('data.csv', 3)

      const fileNamesByKey = generator.fileNamesByKey
      const keysByFileName = generator.keysByFileName

      expect(Object.keys(fileNamesByKey).length).toBe(3)
      expect(Object.keys(keysByFileName).length).toBe(3)

      expect(fileNamesByKey).toMatchObject({
        key1: 'data.csv',
        key2: 'data (1).csv',
        key3: 'data (2).csv',
      })

      expect(keysByFileName).toMatchObject({
        'data.csv': 'key1',
        'data (1).csv': 'key2',
        'data (2).csv': 'key3',
      })
    })
  })
})
