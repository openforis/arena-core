import { User } from '../auth'
import { Node } from '../node'
import { ArenaService } from '../common'

export interface NodeService extends ArenaService {
  // ==== CREATE
  create(options: { filePath?: string; node: Node; socketId: string; surveyId: number; user: User }): Promise<Node>

  // ==== READ
  get(options: { surveyId: number; nodeUuid: string }): Promise<Node>

  // ==== UPDATE
  update(options: { filePath?: string; node: Node; socketId: string; surveyId: number; user: User }): Promise<Node>

  // ==== DELETE
  delete(options: {
    nodeUuid: string
    recordUuid: string
    socketId: string
    surveyId: number
    user: User
  }): Promise<void>
}
