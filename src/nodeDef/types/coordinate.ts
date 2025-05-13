import { NodeDef, NodeDefProps, NodeDefType } from '../nodeDef'

export interface NodeDefCoordinateProps extends NodeDefProps {
  allowOnlyDeviceCoordinate?: boolean
  includeAccuracy?: boolean
  includeAltitude?: boolean
  includeAltitudeAccuracy?: boolean
}

export type NodeDefCoordinate = NodeDef<NodeDefType.coordinate, NodeDefCoordinateProps>
