export interface ValidationMessage {
  key: string
}

export interface Validation {
  errors: Array<ValidationMessage>
  fields: {
    [name: string]: Validation
  }
  valid: boolean
  warnings: Array<ValidationMessage>
}
