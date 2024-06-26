import { User } from '../auth'
import { ArenaService } from '../common'
import { ChainNodeDef } from './chainNodeDef'

export interface ChainNodeDefService extends ArenaService {
  // ==== READ
  count(options: { chainUuid: string; surveyId: number }): Promise<{ [entityDefUuid: string]: number }>

  getMany(options: { chainUuid: string; entityDefUuid: string; surveyId: number }): Promise<Array<ChainNodeDef>>

  // ==== UPDATE
  update(options: { chainNodeDef: ChainNodeDef; surveyId: number; user: User }): Promise<ChainNodeDef>

  updateIndexes(options: { surveyId: number }): Promise<void>
}
