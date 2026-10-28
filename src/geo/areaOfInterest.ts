import type { MultiPolygon, Polygon } from 'geojson'

/**
 * Area of interest of a survey: GeoJSON polygon or multi polygon geometry in WGS84 (EPSG:4326).
 */
export type AreaOfInterest = Polygon | MultiPolygon
