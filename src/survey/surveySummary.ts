import type { ArenaAuthGroup } from '../auth'
import type { ArenaSurvey } from './survey'

/**
 * Item of the surveys list returned by the server: survey without node defs and reference data, plus list fields.
 */
export type ArenaSurveySummary = Omit<
  ArenaSurvey,
  'authGroups' | 'categories' | 'dependencyGraph' | 'nodeDefs' | 'nodeDefsIndex' | 'refData' | 'taxonomies'
> & {
  authGroups?: ArenaAuthGroup[]
  defaultLabel?: string
  ownerName?: string
}

/**
 * A full survey or a survey summary: accepted by the getters that only read the survey props.
 */
export type ArenaSurveyOrSummary = ArenaSurvey | ArenaSurveySummary
