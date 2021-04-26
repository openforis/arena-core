import { NodeDef, NodeDefType } from './nodeDef'
import { User } from '../auth'

export interface NodeDefService {
  // ==== CREATE
  create(options: {
    cycle: string
    nodeDef: NodeDef<NodeDefType>
    user: User
    surveyId: number
  }): Promise<{ [nodeDefUuid: string]: NodeDef<NodeDefType> }>

  // ==== READ
  getMany(options: {
    advanced?: boolean
    cycle?: string
    deleted?: boolean
    draft?: boolean
    limit?: number
    offset?: number
    surveyId: number
    user: User
    validate?: boolean
  }): Promise<{ [nodeDefUuid: string]: NodeDef<NodeDefType> }>

  // ==== UPDATE
  update(options: {
    cycle: string
    nodeDef: NodeDef<NodeDefType>
    user: User
    surveyId: number
  }): Promise<{ [nodeDefUuid: string]: NodeDef<NodeDefType> }>

  // ==== DELETE
  delete(options: {
    cycle: string
    nodeDefUuid: string
    user: User
    surveyId: number
  }): Promise<{ [nodeDefUuid: string]: NodeDef<NodeDefType> }>
}
