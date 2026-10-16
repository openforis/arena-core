import { NodeDef, NodeDefProps, NodeDefType } from '../nodeDef'

export interface NodeDefGeoProps extends NodeDefProps {
  // when true, the value is the track recorded by position tracking in Arena Mobile
  positionTracking?: boolean
}

export type NodeDefGeo = NodeDef<NodeDefType.geo, NodeDefGeoProps>
