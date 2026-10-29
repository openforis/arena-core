import type { AreaOfInterest } from '../geo'
import { Survey } from '../survey'

/**
 * Fetches the geometry of the areas of interest of a survey: they are stored outside the survey (e.g. in files).
 */
export interface AreaOfInterestProvider {
  getAreaOfInterest: (params: { survey: Survey; name: string }) => Promise<AreaOfInterest | undefined>
}
