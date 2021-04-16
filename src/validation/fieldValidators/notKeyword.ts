import { Objects } from '../../utils'
import { ValidationResultFactory } from '../factory'
import { ValidationResult } from '../validation'

const keywords = [
  'asc',
  'date_created',
  'date_modified',
  'desc',
  'file',
  'id',
  'length',
  'node_def_uuid',
  'owner_uuid',
  'parent_id',
  'parent_uuid',
  'props',
  'props_draft',
  'props_advanced',
  'record_uuid',
  'step',
  'uuid',
  'value',
]

export const notKeyword = (messageKey: string) => (field: string, obj: any): ValidationResult | undefined => {
  const value = Objects.path(field)(obj)
  return value && keywords.includes(value) ? ValidationResultFactory.createInstance({ messageKey }) : undefined
}
