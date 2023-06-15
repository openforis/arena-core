import { NodeDef, NodeDefProps, NodeDefType } from '../nodeDef'

export interface NodeDefCoordinateProps extends NodeDefProps {
  allowOnlyDeviceCoordinate: boolean
}

export type NodeDefCoordinate = NodeDef<NodeDefType.coordinate, NodeDefCoordinateProps>
