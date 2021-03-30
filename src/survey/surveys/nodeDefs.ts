import { Survey } from '../survey'
import { NodeDef, NodeDefProps, NodeDefType } from '../../nodeDef'
import { Arrays } from '../../utils'

export const getNodeDefByName = (params: { survey: Survey; name: string }): NodeDef<NodeDefType, NodeDefProps> => {
  const { survey, name } = params
  const nodeDef = Object.values(survey.nodeDefs || {}).find((nodeDef) => nodeDef.props.name === name)
  if (!nodeDef) throw new Error(`Node def with name ${name} not found in survey`)
  return nodeDef
}

export const getNodeDefByUuid = (params: { survey: Survey; uuid: string }): NodeDef<NodeDefType, NodeDefProps> => {
  const { survey, uuid } = params
  const nodeDef = survey.nodeDefs?.[uuid]
  if (!nodeDef) throw new Error(`Node def with uuid ${uuid} not found in survey`)
  return nodeDef
}

export const getNodeDefParent = (params: {
  survey: Survey
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
}): NodeDef<NodeDefType, NodeDefProps> => {
  const { survey, nodeDef } = params
  if (!nodeDef.parentUuid) throw new Error('Cannot get parent def from root def')
  return getNodeDefByUuid({ survey, uuid: nodeDef.parentUuid })
}

export const isNodeDefAncestor = (params: {
  nodeDefAncestor: NodeDef<NodeDefType, NodeDefProps>
  nodeDefDescendant: NodeDef<NodeDefType, NodeDefProps>
}): boolean => {
  const { nodeDefAncestor, nodeDefDescendant } = params

  return Arrays.startsWith(nodeDefDescendant.meta.h, [...nodeDefAncestor.meta.h, nodeDefAncestor.uuid])
}
