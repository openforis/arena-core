import type { ArenaAreaOfInterest } from '../geo'
import { ArenaSurvey } from '../survey'

/**
 * Fetches the geometry of the areas of interest of a survey: they are stored outside the survey (e.g. in files).
 */
export interface ArenaAreaOfInterestProvider {
  getAreaOfInterest: (params: { survey: ArenaSurvey; name: string }) => Promise<ArenaAreaOfInterest | undefined>
}
