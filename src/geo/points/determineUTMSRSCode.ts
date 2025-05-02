import { SRSIndex } from '../../srs'
import { Point } from '../point'
import { determineUTMZoneNumber } from './determineUTMZoneNumber'
import { isInUTMZoneRange } from './isInUTMZoneRange'
import { toLatLong } from './toLatLong'

export const determineUTMSRSCode = (point: Point, srsIndex: SRSIndex): string | null => {
  // Check if the point is in a valid UTM zone range
  if (!isInUTMZoneRange(point, srsIndex)) return null

  const pointLatLon = toLatLong(point, srsIndex)
  const { x: lon, y: lat } = pointLatLon!
  const zoneNumber = determineUTMZoneNumber(lat, lon)
  // Determine hemisphere and construct EPSG code
  return lat >= 0 ? `EPSG:326${zoneNumber}` : `EPSG:327${zoneNumber}`
}
