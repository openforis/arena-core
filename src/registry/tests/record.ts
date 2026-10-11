import { RecordService, RecordFactory, ArenaRecord } from '../../record'
import { userMock } from './user'

export const recordMock: ArenaRecord = RecordFactory.createInstance({
  user: userMock,
  surveyUuid: 'surveyUuid',
})

export class RecordServiceMock implements RecordService {
  create(): Promise<ArenaRecord> {
    throw new Error('Not implemented')
  }

  count(): Promise<number> {
    throw new Error('Not implemented')
  }

  get(): Promise<ArenaRecord> {
    return Promise.resolve(recordMock)
  }

  getMany(): Promise<Array<ArenaRecord>> {
    throw new Error('Not implemented')
  }

  getManyByUuids(): Promise<Array<ArenaRecord>> {
    throw new Error('Not implemented')
  }

  update(): Promise<ArenaRecord> {
    throw new Error('Not implemented')
  }

  checkIn(): Promise<ArenaRecord> {
    throw new Error('Not implemented')
  }
  checkOut(): void {
    throw new Error('Not implemented')
  }

  delete(): void {
    throw new Error('Not implemented')
  }
}
