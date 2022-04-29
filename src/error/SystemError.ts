export class SystemError extends Error {
  private _key: string
  private _params: { [key: string]: string }

  constructor(key: string, params?: { [key: string]: string }) {
    super(key)

    this.name = 'SystemError'

    this._key = key
    this._params = params || {}

    // Maintains proper stack trace (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SystemError)
    }
  }

  get key(): string {
    return this._key
  }

  get params(): { [key: string]: string } {
    return this._params
  }
}
