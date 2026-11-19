import { ArenaNodeDef, ArenaNodeDefProps, NodeDefType } from '../nodeDef'

export interface ArenaNodeDefGeoProps extends ArenaNodeDefProps {
  // when true, the value is the track recorded by position tracking in Arena Mobile
  positionTracking?: boolean
}

export type ArenaNodeDefGeo = ArenaNodeDef<NodeDefType.geo, ArenaNodeDefGeoProps>
