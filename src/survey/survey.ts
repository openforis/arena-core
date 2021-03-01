import { SurveyInfo } from './info'
import { NodeDef, NodeDefType } from '../nodeDef'

export interface SurveyDependency {
  [nodeDefUuid: string]: Array<string>
}

export interface SurveyDependencyGraph {
  defaultValues: SurveyDependency
  applicable: SurveyDependency
  validations: SurveyDependency
  formula: SurveyDependency
}

export interface Survey {
  dependencyGraph?: SurveyDependencyGraph
  info: SurveyInfo
  nodeDefs?: {
    [nodeDefUuid: string]: NodeDef<NodeDefType>
  }
}
