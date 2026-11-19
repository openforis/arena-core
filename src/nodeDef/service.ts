import { ArenaUser } from '../auth'
import { ArenaChainNodeDef } from '../chain'
import { ArenaService } from '../common'
import { ArenaAnyNodeDef } from './nodeDef'

export interface ArenaNodeDefService extends ArenaService {
  // ==== CREATE
  create(options: {
    chainNodeDef?: ArenaChainNodeDef
    cycle: string
    nodeDef: ArenaAnyNodeDef
    surveyId: number
    user: ArenaUser
  }): Promise<{ [nodeDefUuid: string]: ArenaAnyNodeDef }>

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
  }): Promise<{ [nodeDefUuid: string]: ArenaAnyNodeDef }>

  // ==== UPDATE
  update(options: {
    cycle: string
    nodeDef: ArenaAnyNodeDef
    user: ArenaUser
    surveyId: number
  }): Promise<{ [nodeDefUuid: string]: ArenaAnyNodeDef }>

  // ==== DELETE
  delete(options: {
    cycle: string
    nodeDefUuid: string
    user: ArenaUser
    surveyId: number
  }): Promise<{ [nodeDefUuid: string]: ArenaAnyNodeDef }>
}
