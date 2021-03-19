import { RecordService, RecordFactory, Record } from '../../record'
import { userMock } from './user'

export const recordMock: Record = RecordFactory.createInstance({
  user: userMock,
  surveyUuid: 'surveyUuid',
})

export class RecordServiceMock implements RecordService {
  create(): Promise<Record> {
    throw new Error('Not implemented')
  }

  count(): Promise<number> {
    throw new Error('Not implemented')
  }

  get(): Promise<Record> {
    return Promise.resolve(recordMock)
  }

  getMany(): Promise<Array<Record>> {
    throw new Error('Not implemented')
  }

  update(): Promise<Record> {
    throw new Error('Not implemented')
  }

  checkIn(): Promise<Record> {
    throw new Error('Not implemented')
  }
  checkOut(): void {
    throw new Error('Not implemented')
  }

  delete(): void {
    throw new Error('Not implemented')
  }
}
