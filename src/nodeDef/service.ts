import { User } from '../auth'
import { ChainNodeDef } from '../chain'
import { NodeDef, NodeDefType } from './nodeDef'

export interface NodeDefService {
  // ==== CREATE
  create(options: {
    chainNodeDef?: ChainNodeDef
    cycle: string
    nodeDef: NodeDef<NodeDefType>
    surveyId: number
    user: User
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
