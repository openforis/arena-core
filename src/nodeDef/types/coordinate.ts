import { ArenaNodeDef, ArenaNodeDefProps, NodeDefType } from '../nodeDef'

export interface ArenaNodeDefCoordinateProps extends ArenaNodeDefProps {
  allowOnlyDeviceCoordinate?: boolean
  includeAccuracy?: boolean
  includeAltitude?: boolean
  includeAltitudeAccuracy?: boolean
}

export type ArenaNodeDefCoordinate = ArenaNodeDef<NodeDefType.coordinate, ArenaNodeDefCoordinateProps>

/** Optional fields of a coordinate value, included according to the node def props. */
export type ArenaCoordinateAdditionalField = 'accuracy' | 'altitude' | 'altitudeAccuracy'
