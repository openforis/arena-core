import { ArenaService } from '../common'
import { UserAuthRefreshToken, UserAuthRefreshTokenProps, UserAuthToken } from './userAuth'

export interface UserAuthTokenService extends ArenaService {
  // ==== CREATE
  createAuthToken(options: { userUuid: string }): UserAuthToken
  createRefreshToken(
    options: { userUuid: string; props: UserAuthRefreshTokenProps },
    dbClient?: any
  ): Promise<UserAuthRefreshToken>

  // ==== READ
  getByUuid(tokenUuid: string): Promise<UserAuthRefreshToken | null>

  // ==== UPDATE
  revoke(options: { tokenUuid: string }): Promise<void>
  revokeAll(options: { userUuid: string }): Promise<void>
  rotateRefreshToken(
    options: { oldRefreshTokenUuid: string; userUuid: string; props: UserAuthRefreshTokenProps },
    dbClient?: any
  ): Promise<UserAuthRefreshToken>
  rotateTokens(options: { refreshToken: string; refreshTokenProps: UserAuthRefreshTokenProps }): Promise<{
    authToken: UserAuthToken
    refreshToken: UserAuthRefreshToken
  } | null>

  // ==== DELETE
  deleteExpired(): Promise<number>
}
