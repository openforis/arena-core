import { ArenaUser } from '../auth'
import { ArenaService } from '../common'
import { ArenaChain } from './chain'

export interface ArenaChainService extends ArenaService {
  // ==== CREATE
  create(options: { chain: ArenaChain; surveyId: number; user: ArenaUser }): Promise<ArenaChain>

  // ==== READ
  count(options: { cycle: string; surveyId: number }): Promise<number>

  getMany(options: { cycle: string; limit?: number; offset?: number; surveyId: number }): Promise<Array<ArenaChain>>

  get(options: { chainUuid: string; surveyId: number }): Promise<ArenaChain>

  // ==== UPDATE
  update(options: { chain: ArenaChain; surveyId: number; user: ArenaUser }): Promise<ArenaChain>

  // ==== DELETE
  delete(options: { chainUuid: string; surveyId: number; user: ArenaUser }): Promise<ArenaChain>
}
