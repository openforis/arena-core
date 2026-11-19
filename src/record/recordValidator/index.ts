import { validateNodes, validateRecord, validateSortedNodes } from './recordValidator'

export type {
  ArenaAttributeValidatorParams,
  ArenaAttributesValidatorParams,
  ArenaRecordValidatorParams,
  ArenaSortedAttributesValidatorParams,
} from './attributeValidator'

export const RecordValidator = {
  validateNodes,
  validateSortedNodes,
  validateRecord,
}
