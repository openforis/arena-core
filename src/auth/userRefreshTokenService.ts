import { UserRefreshToken } from '../auth'
import { ArenaService } from '../common'

export interface UserRefreshTokenService extends ArenaService {
  // ==== CREATE
  create(options: UserRefreshToken): Promise<UserRefreshToken>

  // ==== READ
  getByUuid(tokenUuid: string): Promise<UserRefreshToken | null>

  // ==== UPDATE
  revoke(options: { tokenUuid: string }): Promise<void>
  revokeAll(options: { userUuid: string }): Promise<void>

  // ==== DELETE
  deleteExpired(): Promise<number>
}
