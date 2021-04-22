import { User } from '../auth'
import { Record } from './record'

export interface RecordService {
  // ==== CREATE
  create(options: { socketId: string; record: Record; surveyId: number; user: User }): Promise<Record>

  // ==== READ
  count(options: { cycle: string; surveyId: number }): Promise<number>

  get(options: { recordUuid: string; surveyId: number }): Promise<Record | null>

  getMany(options: { cycle: string; limit: number; offset: number; surveyId: number }): Promise<Record[]>

  // ==== UPDATE
  update(options: { recordUuid: string; step: string; surveyId: number; user: User }): Promise<Record>

  checkIn(options: {
    draft?: boolean
    recordUuid: string
    socketId: string
    surveyId: number
    user: User
  }): Promise<Record>

  checkOut(options: { recordUuid: string; socketId: string; surveyId: number; user: User }): void

  // ==== DELETE
  delete(options: { recordUuid: string; socketId: string; surveyId: number; user: User }): void
}
