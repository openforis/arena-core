import { User } from 'src/auth'
import { Node } from 'src/node'

export interface CategoryService {
  // ==== CREATE
  create(options: { filePath?: string; node: Node; socketId: string; surveyId: number; user: User }): Promise<Node>

  // ==== READ
  get(options: { surveyId: number; nodeUuid: string }): Promise<Node>

  // ==== UPDATE
  update(options: { filePath?: string; node: Node; socketId: string; surveyId: number; user: User }): void

  // ==== DELETE
  delete(options: {
    nodeUuid: string
    recordUuid: string
    socketId: string
    surveyId: number
    user: User
  }): Promise<void>
}
