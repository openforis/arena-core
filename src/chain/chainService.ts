import { Chain } from './chain'

export interface ChainService {
  // ==== READ
  count(options: { cycle: string; surveyId: number }): Promise<number>

  getMany(options: { cycle: string; limit?: number; offset?: number; surveyId: number }): Promise<Array<Chain>>

  get(options: { chainUuid: string; surveyId: number }): Promise<Chain>
}
