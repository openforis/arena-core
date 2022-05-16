import { NodeDef, NodeDefExpression, NodeDefProps, NodeDefType, NodeDefValidations } from '../nodeDef'

const isRoot = (nodeDef: NodeDef<NodeDefType>): boolean => !nodeDef.parentUuid

const isEntity = (nodeDef: NodeDef<NodeDefType>): boolean => nodeDef.type === NodeDefType.entity

const isSingleEntity = (nodeDef: NodeDef<NodeDefType>): boolean => isEntity(nodeDef) && !nodeDef.props.multiple

const isAttribute = (nodeDef: NodeDef<NodeDefType>): boolean => !isEntity(nodeDef)

const isKey = (nodeDef: NodeDef<NodeDefType, NodeDefProps>): boolean => nodeDef.props.key || false

const getType = (nodeDef: NodeDef<NodeDefType>): NodeDefType => nodeDef.type

const getDefaultValues = (nodeDef: NodeDef<NodeDefType>): NodeDefExpression[] =>
  nodeDef.propsAdvanced?.defaultValues || []

const getApplicable = (nodeDef: NodeDef<NodeDefType>): NodeDefExpression[] => nodeDef.propsAdvanced?.applicable || []

const getValidations = (nodeDef: NodeDef<NodeDefType>): NodeDefValidations | undefined =>
  nodeDef.propsAdvanced?.validations

export const NodeDefs = {
  isEntity,
  isSingleEntity,
  isAttribute,
  isKey,
  isRoot,
  getType,
  getDefaultValues,
  getApplicable,
  getValidations,
}
