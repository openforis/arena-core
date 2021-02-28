import { NodeDef, NodeDefType } from 'src/nodeDef'
import { SurveyInfo } from './info'

export interface Survey {
  info: SurveyInfo
  nodeDefs: {
    [nodeDefUuid: string]: NodeDef<NodeDefType>
  }
}
