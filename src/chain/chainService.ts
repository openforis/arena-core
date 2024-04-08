import { User } from '../auth'
import { ArenaService } from '../common'
import { Chain } from './chain'

export interface ChainService extends ArenaService {
  // ==== CREATE
  create(options: { chain: Chain; surveyId: number; user: User }): Promise<Chain>

  // ==== READ
  count(options: { cycle: string; surveyId: number }): Promise<number>

  getMany(options: { cycle: string; limit?: number; offset?: number; surveyId: number }): Promise<Array<Chain>>

  get(options: { chainUuid: string; surveyId: number }): Promise<Chain>

  // ==== UPDATE
  update(options: { chain: Chain; surveyId: number; user: User }): Promise<Chain>

  // ==== DELETE
  delete(options: { chainUuid: string; surveyId: number; user: User }): Promise<Chain>
}
