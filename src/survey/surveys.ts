import { NodeDef, NodeDefProps, NodeDefType } from '../nodeDef'
import { Survey } from './survey'

const getNodeDefByName = (params: { survey: Survey; name: string }): NodeDef<NodeDefType, NodeDefProps> => {
  const { survey, name } = params
  const nodeDef = Object.values(survey.nodeDefs || {}).find((nodeDef) => nodeDef.props.name === name)
  if (!nodeDef) throw new Error(`Node def with name ${name} not found in survey`)
  return nodeDef
}

export const Surveys = {
  getNodeDefByName,
}
