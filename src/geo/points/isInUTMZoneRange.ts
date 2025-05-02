import { SRSIndex } from '../../srs'
import { Point } from '../point'
import { determineUTMZoneNumber } from './determineUTMZoneNumber'
import { toLatLong } from './toLatLong'

export const isInUTMZoneRange = (point: Point, srsIndex: SRSIndex): boolean => {
  const pointLatLon = toLatLong(point, srsIndex)
  if (!pointLatLon) return false
  const { x: lon, y: lat } = pointLatLon
  const zone = determineUTMZoneNumber(lat, lon)

  // Validate longitude against the calculated zone's range
  const zoneLonMin = (zone - 1) * 6 - 180
  const zoneLonMax = zone * 6 - 180

  return lon >= zoneLonMin && lon < zoneLonMax
}
