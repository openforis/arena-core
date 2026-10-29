import { Dictionary } from '../common'
import { FileNames } from '../utils'

const nameWithIndexRegEx = /^(.*) \((\d+)\)$/ // file name like "example (1).txt"

export class UniqueFileNamesGenerator {
  private _fileNamesByKey: Dictionary<string>
  private _keysByFileName: Dictionary<string>
  // file names are compared ignoring case: names differing only in case overwrite each other on Windows/macOS
  private readonly _fileNamesLowerCase: Set<string>
  // last file name generated starting from a given first candidate file name (e.g. "image (1).jpg" => "image (25).jpg"):
  // the names before it in the sequence are all used already, so the search can start from it
  private readonly _lastGeneratedFileNameByFirstCandidate: Map<string, string>

  constructor() {
    this._fileNamesByKey = {}
    this._keysByFileName = {}
    this._fileNamesLowerCase = new Set()
    this._lastGeneratedFileNameByFirstCandidate = new Map()
  }

  private isFileNameUsed(fileName: string): boolean {
    return this._fileNamesLowerCase.has(fileName.toLowerCase())
  }

  private assignFileName(fileName: string, key: string): string {
    this._keysByFileName[fileName] = key
    this._fileNamesByKey[key] = fileName
    this._fileNamesLowerCase.add(fileName.toLowerCase())
    return fileName
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
    if (!this.isFileNameUsed(inputFileName)) {
      // file name not used yet
      return this.assignFileName(inputFileName, key)
    }
    const firstCandidate = this.generateNextFileName(inputFileName)
    let generatedFileName = this._lastGeneratedFileNameByFirstCandidate.get(firstCandidate) ?? firstCandidate
    while (this.isFileNameUsed(generatedFileName)) {
      // file name already exists, generate the next one
      generatedFileName = this.generateNextFileName(generatedFileName)
    }
    this._lastGeneratedFileNameByFirstCandidate.set(firstCandidate, generatedFileName)
    return this.assignFileName(generatedFileName, key)
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
