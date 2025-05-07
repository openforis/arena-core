import { ValidationResult } from './validation'

export type FieldValidator = (field: string, obj: any) => Promise<ValidationResult>
