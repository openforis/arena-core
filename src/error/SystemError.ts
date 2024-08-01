import { Dictionary } from '../common'

export class SystemError extends Error {
  private _key: string
  private _params: Dictionary<any>

  constructor(key: string, params?: Dictionary<any>) {
    super(key)

    this.name = 'SystemError'

    this._key = key
    this._params = params ?? {}

    // Maintains proper stack trace (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SystemError)
    }
  }

  get key(): string {
    return this._key
  }

  get params(): Dictionary<any> {
    return this._params
  }

  toJSON() {
    const { key, params } = this
    const { error: nestedError } = params ?? {}
    const paramsAdjusted: Dictionary<any> =
      nestedError && nestedError instanceof SystemError ? { ...params, error: nestedError?.toJSON() } : params
    return { key, params: paramsAdjusted }
  }
}
