import { FileNames } from './fileNames'

describe('FileNames', () => {
  const testCases = [
    { fileName: 'test.abc', expectedExtension: 'abc' },
    { fileName: null, expectedExtension: '' },
    { fileName: 'test', expectedExtension: '' },
    { fileName: 'test.', expectedExtension: '' },
  ]
  testCases.forEach(({ fileName, expectedExtension }) => {
    test(`getExtension(${fileName})`, () => {
      expect(FileNames.getExtension(fileName)).toBe(expectedExtension)
    })
  })
})
