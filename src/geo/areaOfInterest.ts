import type { MultiPolygon, Polygon } from 'geojson'

import type { ArenaLabels } from '../language'

/**
 * Area of interest geometry: GeoJSON polygon or multi polygon in WGS84 (EPSG:4326).
 */
export type ArenaAreaOfInterest = Polygon | MultiPolygon

/**
 * Area of interest defined in a survey; the geometry is stored in a separate file (fetched by AreaOfInterestProvider).
 */
export interface ArenaAreaOfInterestDescriptor {
  // identifier used in expressions
  name: string
  labels?: ArenaLabels
  fileUuid: string
  fileName: string
  size: number
  polygons: number
  vertices: number
}
