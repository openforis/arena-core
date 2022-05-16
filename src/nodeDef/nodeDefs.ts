import { NodeDefType } from '.'
import { NodeDef, NodeDefExpression } from './nodeDef'

const isEntity = (nodeDef: NodeDef<NodeDefType>): boolean => nodeDef.type === NodeDefType.entity

const isSingleEntity = (nodeDef: NodeDef<NodeDefType>): boolean => isEntity(nodeDef) && !nodeDef.props.multiple

const isAttribute = (nodeDef: NodeDef<NodeDefType>): boolean => !isEntity(nodeDef)

const isRoot = (nodeDef: NodeDef<NodeDefType>): boolean => !nodeDef.parentUuid

const getType = (nodeDef: NodeDef<NodeDefType>): NodeDefType => nodeDef.type

const getDefaultValues = (nodeDef: NodeDef<NodeDefType>): NodeDefExpression[] =>
  nodeDef.propsAdvanced?.defaultValues || []

const getApplicable = (nodeDef: NodeDef<NodeDefType>): NodeDefExpression[] => nodeDef.propsAdvanced?.applicable || []

export const NodeDefs = {
  isEntity,
  isSingleEntity,
  isAttribute,
  isRoot,
  getType,
  getDefaultValues,
  getApplicable,
}
