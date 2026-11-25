import type { Feature, LineString, MultiLineString, MultiPolygon, Polygon } from 'geojson'

/**
 * Value of a geo attribute drawn as a polygon: GeoJSON feature in WGS84 (EPSG:4326).
 */
export type ArenaGeoPolygonFeature = Feature<Polygon | MultiPolygon>

/**
 * Properties of a track: time and accuracy of each recorded position (nested arrays for multi line strings).
 */
export type ArenaGeoTrackFeatureProperties = {
  coordTimes?: string[] | string[][]
  accuracies?: (number | null)[] | (number | null)[][]
}

/**
 * Value of a geo attribute recorded by position tracking: GeoJSON line feature in WGS84 (EPSG:4326).
 */
export type ArenaGeoTrackFeature = Feature<LineString | MultiLineString, ArenaGeoTrackFeatureProperties>
