import { Arrays } from '../utils'
import { NodeDef, NodeDefProps, NodeDefType } from '../nodeDef'
import { Survey } from './survey'

const getNodeDefByName = (params: { survey: Survey; name: string }): NodeDef<NodeDefType, NodeDefProps> => {
  const { survey, name } = params
  const nodeDef = Object.values(survey.nodeDefs || {}).find((nodeDef) => nodeDef.props.name === name)
  if (!nodeDef) throw new Error(`Node def with name ${name} not found in survey`)
  return nodeDef
}

const getNodeDefByUuid = (params: { survey: Survey; uuid: string }): NodeDef<NodeDefType, NodeDefProps> => {
  const { survey, uuid } = params
  const nodeDef = survey.nodeDefs?.[uuid]
  if (!nodeDef) throw new Error(`Node def with uuid ${uuid} not found in survey`)
  return nodeDef
}

const getNodeDefParent = (params: {
  survey: Survey
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
}): NodeDef<NodeDefType, NodeDefProps> => {
  const { survey, nodeDef } = params
  if (!nodeDef.parentUuid) throw new Error('Cannot get parent def from root def')
  return getNodeDefByUuid({ survey, uuid: nodeDef.parentUuid })
}

const isNodeDefAncestor = (params: {
  nodeDefAncestor: NodeDef<NodeDefType, NodeDefProps>
  nodeDefDescendant: NodeDef<NodeDefType, NodeDefProps>
}): boolean => {
  const { nodeDefAncestor, nodeDefDescendant } = params

  return Arrays.startsWith(nodeDefDescendant.meta.h, nodeDefAncestor.meta.h)
}

export const Surveys = {
  getNodeDefByName,
  getNodeDefByUuid,
  getNodeDefParent,
  isNodeDefAncestor,
}
