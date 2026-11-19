import { ArenaAnyNodeDef, ArenaNodeDef } from '../../../nodeDef'
import { ArenaSurvey } from '../../survey'

export const getNodeDefsArray = (survey: ArenaSurvey): Array<ArenaAnyNodeDef> => Object.values(survey.nodeDefs ?? {})

export const calculateNodeDefChildren =
  (nodeDef: ArenaAnyNodeDef) =>
  (survey: ArenaSurvey): ArenaNodeDef<any>[] =>
    getNodeDefsArray(survey).filter((nodeDefCurrent) => nodeDefCurrent.parentUuid === nodeDef.uuid)
