import { User } from '../auth'
import { Service } from '../registry'

export interface UserService extends Service {
  // ==== CREATE
  create(options: {
    user: User
    surveyId: number
    surveyCycleKey: string
    userToInviteParam: string
    urlServer: string
    repeatInvitation?: boolean
  }): Promise<User>

  // ==== READ
  count(options: { user: User; surveyId: number }): Promise<number>

  get(options: { userUuid: string } | { email: string; password?: string }): Promise<User | null>
  getMany(options: { surveyId: number; limit?: number; offset?: number; user: User }): Promise<Array<User>>
  getProfilePicture(options: { userUuid: string }): Promise<string>

  // ==== UPDATE
  update(options: { user: User; surveyId: number; userToUpdate: User; filePath?: string }): Promise<User>
  updateUserPrefs(options: { userToUpdate: User }): Promise<User>

  // ==== DELETE
  delete(options: { surveyId: number; user: User; userUuid: string }): Promise<void>
}
