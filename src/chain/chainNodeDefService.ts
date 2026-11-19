import { ArenaUser } from '../auth'
import { ArenaService } from '../common'
import { ArenaChainNodeDef } from './chainNodeDef'

export interface ArenaChainNodeDefService extends ArenaService {
  // ==== READ
  count(options: { chainUuid: string; surveyId: number }): Promise<{ [entityDefUuid: string]: number }>

  getMany(options: { chainUuid: string; entityDefUuid: string; surveyId: number }): Promise<Array<ArenaChainNodeDef>>

  // ==== UPDATE
  update(options: { chainNodeDef: ArenaChainNodeDef; surveyId: number; user: ArenaUser }): Promise<ArenaChainNodeDef>

  updateIndexes(options: { surveyId: number }): Promise<void>
}
