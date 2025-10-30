import { UserRefreshToken, UserRefreshTokenProps } from '.'
import { ArenaService } from '../common'

export interface UserAuthTokenService extends ArenaService {
  // ==== CREATE
  createAuthToken(options: { userUuid: string }): string
  createRefreshToken(
    options: { userUuid: string; props: UserRefreshTokenProps },
    dbClient?: any
  ): Promise<UserRefreshToken>

  // ==== READ
  getByUuid(tokenUuid: string): Promise<UserRefreshToken | null>

  // ==== UPDATE
  revoke(options: { tokenUuid: string }): Promise<void>
  revokeAll(options: { userUuid: string }): Promise<void>
  rotateRefreshToken(
    options: { oldRefreshTokenUuid: string; userUuid: string; props: UserRefreshTokenProps },
    dbClient?: any
  ): Promise<UserRefreshToken>

  // ==== DELETE
  deleteExpired(): Promise<number>
}
