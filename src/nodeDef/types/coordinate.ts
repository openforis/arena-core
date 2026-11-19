import { ArenaNodeDef, ArenaNodeDefProps, NodeDefType } from '../nodeDef'

export interface ArenaNodeDefCoordinateProps extends ArenaNodeDefProps {
  allowOnlyDeviceCoordinate?: boolean
  includeAccuracy?: boolean
  includeAltitude?: boolean
  includeAltitudeAccuracy?: boolean
}

export type ArenaNodeDefCoordinate = ArenaNodeDef<NodeDefType.coordinate, ArenaNodeDefCoordinateProps>
