import { ValidationResult } from './validation'

export type FieldValidator = (field: string, obj: any) => ValidationResult
