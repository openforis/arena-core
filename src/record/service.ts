import { User } from 'src/auth'
import { Step } from 'src/chain'
import { Record } from './record'

export interface RecordService {
  // ==== CREATE
  create(options: { socketId: string; user: User; surveyId: number; record: Record }): Promise<Record>

  // ==== READ
  count(options: { surveyId: number; cycle: string }): Promise<number>

  get(options: { surveyId: number; cycle: string }): Promise<Record>
  getMany(options: { surveyId: number; cycle: string; offset: number; limit: number }): Promise<Record[]>

  // ==== UPDATE
  update(options: { user: User; surveyId: number; recordUuid: string; step: Step }): Promise<Record>

  checkIn(options: {
    socketId: string
    user: User
    surveyId: number
    recordUuid: string
    draft?: boolean
  }): Promise<Record>

  checkOut(options: { socketId: string; user: User; surveyId: number; recordUuid: string }): void

  // ==== DELETE
  delete(options: { socketId: string; user: User; surveyId: number; recordUuid: string }): void
}
