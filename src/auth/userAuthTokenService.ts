import { UserAuthToken, UserRefreshToken, UserRefreshTokenProps } from './user'
import { ArenaService } from '../common'

export interface UserAuthTokenService extends ArenaService {
  // ==== CREATE
  createAuthToken(options: { userUuid: string }): UserAuthToken
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
  rotateTokens(options: { refreshToken: string; refreshTokenProps: UserRefreshTokenProps }): Promise<{
    authToken: UserAuthToken
    refreshToken: UserRefreshToken
  } | null>

  // ==== DELETE
  deleteExpired(): Promise<number>
}
