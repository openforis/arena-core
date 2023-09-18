import { NodeDef, NodeDefProps, NodeDefType } from '../../../nodeDef'
import { Survey } from '../../survey'

export const getNodeDefsArray = (survey: Survey): Array<NodeDef<NodeDefType, NodeDefProps>> =>
  Object.values(survey.nodeDefs ?? {})

export const calculateNodeDefChildren =
  (nodeDef: NodeDef<NodeDefType, NodeDefProps>) =>
  (survey: Survey): NodeDef<any>[] =>
    getNodeDefsArray(survey).filter((nodeDefCurrent) => nodeDefCurrent.parentUuid === nodeDef.uuid)
