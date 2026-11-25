/**
 * Item of the record summaries list returned by the server (key and summary attribute values by node def name).
 */
export type ArenaRecordSummary = {
  uuid: string
  cycle: string
  dateCreated?: string
  dateModified?: string
  ownerUuid?: string
  ownerName?: string
  // number in some server responses
  step?: string | number
  readOnly?: boolean
  keysObj?: Record<string, unknown>
  summaryAttributesObj?: Record<string, unknown>
}
