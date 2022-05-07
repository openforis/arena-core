import { NodeDefType } from '.'
import { NodeDef } from './nodeDef'

const isEntity = (nodeDef: NodeDef<NodeDefType>): boolean => nodeDef.type === NodeDefType.entity

const isSingleEntity = (nodeDef: NodeDef<NodeDefType>): boolean => isEntity(nodeDef) && !nodeDef.props.multiple

const isAttribute = (nodeDef: NodeDef<NodeDefType>): boolean => !isEntity(nodeDef)

const isRoot = (nodeDef: NodeDef<NodeDefType>): boolean => !nodeDef.parentUuid

export const NodeDefs = {
  isEntity,
  isSingleEntity,
  isAttribute,
  isRoot,
}
