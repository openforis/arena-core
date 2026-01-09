import { Dictionary } from '../common'
import { FileNames } from '../utils'

const nameWithIndexRegEx = /^(.*) \((\d+)\)$/ // file name like "example (1).txt"

export class UniqueFileNamesGenerator {
  private _fileNamesByKey: Dictionary<string>
  private _keysByFileName: Dictionary<string>

  constructor() {
    this._fileNamesByKey = {}
    this._keysByFileName = {}
  }

  /**
   * Generates a unique file name for the given key.
   *
   * If the key has been used before, the previously generated file name
   * associated with that key is returned, regardless of the current
   * {@link inputFileName} value.
   *
   * If the key has not been used before, the method either:
   * - returns {@link inputFileName} if it has not been used for another key, or
   * - generates the next available non-conflicting name by appending or
   *   incrementing a numeric index in parentheses.
   *
   * @param inputFileName The desired base file name, including extension.
   * @param key A logical identifier whose associated file name should remain stable across calls.
   * @returns The unique file name associated with the given key.
   */
  generateUniqueFileName(inputFileName: string, key: string): string {
    const existingFileName = this._fileNamesByKey[key]
    if (existingFileName) {
      return existingFileName
    }
    if (!this._keysByFileName[inputFileName]) {
      // file name not used yet
      this._keysByFileName[inputFileName] = key
      this._fileNamesByKey[key] = inputFileName
      return inputFileName
    }
    let generatedFileName = this.generateNextFileName(inputFileName)
    while (this._keysByFileName[generatedFileName]) {
      // file name already exists, generate the next one
      generatedFileName = this.generateNextFileName(generatedFileName)
    }
    this._keysByFileName[generatedFileName] = key
    this._fileNamesByKey[key] = generatedFileName
    return generatedFileName
  }

  /**
   * Generates a new file name by incrementing an existing numeric suffix
   * of the form "name (n)" or appending " (1)" if no such suffix exists.
   *
   * @param inputFileName The original file name, including its extension.
   * @returns The updated file name with an incremented or newly added numeric suffix.
   */
  protected generateNextFileName(inputFileName: string): string {
    const name = FileNames.getName(inputFileName)
    const extension = FileNames.getExtension(inputFileName)
    let nameUpdated
    const matchRes = nameWithIndexRegEx.exec(name)
    if (matchRes) {
      const [, nameWithoutIndex, index] = matchRes
      const nextIndex = Number(index) + 1
      nameUpdated = `${nameWithoutIndex} (${nextIndex})`
    } else {
      nameUpdated = `${name} (1)`
    }
    return extension ? `${nameUpdated}.${extension}` : nameUpdated
  }

  get fileNamesByKey(): Readonly<Dictionary<string>> {
    return { ...this._fileNamesByKey }
  }

  get keysByFileName(): Readonly<Dictionary<string>> {
    return { ...this._keysByFileName }
  }
}
