import { Validation } from './validation'

export const isValid = (validation: Validation) => validation?.valid || false
