import { User } from '../auth'
import { ArenaService } from '../common'
import { ArenaRecord } from './record'

export interface RecordService extends ArenaService {
  // ==== CREATE
  create(options: { socketId: string; record: ArenaRecord; surveyId: number; user: User }): Promise<ArenaRecord>

  // ==== READ
  count(options: { cycle: string; surveyId: number }): Promise<number>

  get(options: { recordUuid: string; surveyId: number }): Promise<ArenaRecord>

  getMany(options: { cycle: string; limit: number; offset: number; surveyId: number }): Promise<ArenaRecord[]>

  getManyByUuids(options: { surveyId: number; uuids: string[] }): Promise<ArenaRecord[]>

  // ==== UPDATE
  update(options: { recordUuid: string; step: string; surveyId: number; user: User }): Promise<ArenaRecord>

  checkIn(options: {
    draft?: boolean
    recordUuid: string
    socketId: string
    surveyId: number
    user: User
  }): Promise<ArenaRecord>

  checkOut(options: { recordUuid: string; socketId: string; surveyId: number; user: User }): void

  // ==== DELETE
  delete(options: { recordUuid: string; socketId: string; surveyId: number; user: User }): void
}
