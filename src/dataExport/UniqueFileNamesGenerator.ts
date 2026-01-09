import { Dictionary } from '../common'
import { FileNames } from '../utils'

const nameWithIndexRegEx = /^(.*)\s\((\d+)\)$/ // file name like "example (1).txt"

export class UniqueFileNamesGenerator {
  private _fileNamesByKey: Dictionary<string>
  private _keysByFileName: Dictionary<string>

  constructor() {
    this._fileNamesByKey = {}
    this._keysByFileName = {}
  }

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

  protected generateNextFileName(inputFileName: string): string {
    const name = FileNames.getName(inputFileName)
    const extension = FileNames.getExtension(inputFileName)
    const matchRes = name.match(nameWithIndexRegEx)
    let nameUpdated
    if (matchRes) {
      const [, nameWithoutIndex, index] = matchRes
      const nextIndex = Number(index) + 1
      nameUpdated = `${nameWithoutIndex} (${nextIndex})`
    } else {
      nameUpdated = `${name} (1)`
    }
    return extension ? `${nameUpdated}.${extension}` : nameUpdated
  }

  get fileNamesByKey() {
    return this._fileNamesByKey
  }

  get keysByFileName() {
    return this._keysByFileName
  }
}
