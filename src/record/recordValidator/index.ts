import { validateNodes, validateRecord, validateSortedNodes } from './recordValidator'

export type {
  AttributeValidatorParams,
  AttributesValidatorParams,
  RecordValidatorParams,
  SortedAttributesValidatorParams,
} from './attributeValidator'

export const RecordValidator = {
  validateNodes,
  validateSortedNodes,
  validateRecord,
}
