import proj4 from 'proj4'

import { DEFAULT_SRS, SRSs } from '../../srs'
import { Point } from '../point'
import { PointFactory } from '../pointFactory'
import { isFilled } from './isFilled'

export const toLatLong = (point: Point): Point | null => {
  if (!isFilled(point)) return null

  const { x, y, srs } = point

  if (srs === DEFAULT_SRS.code) {
    // projection is not needed
    return point
  }

  const srsFrom = SRSs.getSRSByCode(srs)
  if (!srsFrom) return null

  const srsTo = DEFAULT_SRS
  const [long, lat] = proj4(srsFrom.wkt, srsTo.wkt, [x, y])

  return PointFactory.createInstance({ srs: DEFAULT_SRS.code, x: long, y: lat })
}
