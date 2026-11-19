import { ArenaUser } from '../auth'
import { ArenaService } from '../common'

export interface ArenaUserService extends ArenaService {
  // ==== CREATE
  create(options: {
    user: ArenaUser
    surveyId: number
    surveyCycleKey: string
    userToInviteParam: string
    urlServer: string
    repeatInvitation?: boolean
  }): Promise<ArenaUser>

  // ==== READ
  count(options: { user: ArenaUser; surveyId: number }): Promise<number>

  get(options: { userUuid: string } | { email: string; password?: string }): Promise<ArenaUser | null>
  getMany(options: { surveyId: number; limit?: number; offset?: number; user: ArenaUser }): Promise<Array<ArenaUser>>
  getProfilePicture(options: { userUuid: string }): Promise<string>

  // ==== UPDATE
  update(options: { user: ArenaUser; surveyId: number; userToUpdate: ArenaUser; filePath?: string }): Promise<ArenaUser>
  updateUserPrefs(options: { userToUpdate: ArenaUser }): Promise<ArenaUser>

  // ==== DELETE
  delete(options: { surveyId: number; user: ArenaUser; userUuid: string }): Promise<void>
}
