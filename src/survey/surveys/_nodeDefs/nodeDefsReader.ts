import { ArenaNodeDef, ArenaNodeDefProps, NodeDefType } from '../../../nodeDef'
import { ArenaSurvey } from '../../survey'

export const getNodeDefsArray = (survey: ArenaSurvey): Array<ArenaNodeDef<NodeDefType, ArenaNodeDefProps>> =>
  Object.values(survey.nodeDefs ?? {})

export const calculateNodeDefChildren =
  (nodeDef: ArenaNodeDef<NodeDefType, ArenaNodeDefProps>) =>
  (survey: ArenaSurvey): ArenaNodeDef<any>[] =>
    getNodeDefsArray(survey).filter((nodeDefCurrent) => nodeDefCurrent.parentUuid === nodeDef.uuid)
