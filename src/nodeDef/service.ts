import { ArenaUser } from '../auth'
import { ArenaChainNodeDef } from '../chain'
import { ArenaService } from '../common'
import { ArenaNodeDef, NodeDefType } from './nodeDef'

export interface ArenaNodeDefService extends ArenaService {
  // ==== CREATE
  create(options: {
    chainNodeDef?: ArenaChainNodeDef
    cycle: string
    nodeDef: ArenaNodeDef<NodeDefType>
    surveyId: number
    user: ArenaUser
  }): Promise<{ [nodeDefUuid: string]: ArenaNodeDef<NodeDefType> }>

  // ==== READ
  getMany(options: {
    advanced?: boolean
    cycle?: string
    deleted?: boolean
    draft?: boolean
    limit?: number
    offset?: number
    surveyId: number
    user: ArenaUser
    validate?: boolean
  }): Promise<{ [nodeDefUuid: string]: ArenaNodeDef<NodeDefType> }>

  // ==== UPDATE
  update(options: {
    cycle: string
    nodeDef: ArenaNodeDef<NodeDefType>
    user: ArenaUser
    surveyId: number
  }): Promise<{ [nodeDefUuid: string]: ArenaNodeDef<NodeDefType> }>

  // ==== DELETE
  delete(options: {
    cycle: string
    nodeDefUuid: string
    user: ArenaUser
    surveyId: number
  }): Promise<{ [nodeDefUuid: string]: ArenaNodeDef<NodeDefType> }>
}
