import { User } from '../auth'
import { ArenaRecordNode } from '../node'
import { ArenaService } from '../common'

export interface NodeService extends ArenaService {
  // ==== CREATE
  create(options: {
    filePath?: string
    node: ArenaRecordNode
    socketId: string
    surveyId: number
    user: User
  }): Promise<ArenaRecordNode>

  // ==== READ
  get(options: { surveyId: number; nodeUuid: string }): Promise<ArenaRecordNode>

  // ==== UPDATE
  update(options: {
    filePath?: string
    node: ArenaRecordNode
    socketId: string
    surveyId: number
    user: User
  }): Promise<ArenaRecordNode>

  // ==== DELETE
  delete(options: {
    nodeUuid: string
    recordUuid: string
    socketId: string
    surveyId: number
    user: User
  }): Promise<void>
}
