import type { ArenaRecordNodeValueCode } from './code'
import type { ArenaRecordNodeValueCoordinate } from './coordinate'
import type { ArenaRecordNodeValueFile } from './file'
import type { ArenaRecordNodeValueGeo } from './geo'
import type { ArenaRecordNodeValueTaxon } from './taxon'

/**
 * Value of a record node of any type (date and time values are strings).
 */
export type ArenaRecordNodeValue =
  | ArenaRecordNodeValueCode
  | ArenaRecordNodeValueCoordinate
  | ArenaRecordNodeValueFile
  | ArenaRecordNodeValueGeo
  | ArenaRecordNodeValueTaxon
  | boolean
  | number
  | string
