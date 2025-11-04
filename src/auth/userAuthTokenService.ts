import { ArenaService } from '../common'
import { UserAuthRefreshToken, UserAuthRefreshTokenProps, UserAuthToken, UserTokenPayload } from './userAuth'

export interface UserAuthTokenService extends ArenaService {
  // ==== CREATE
  createTokens(
    options: { userUuid: string; props: UserAuthRefreshTokenProps },
    dbClient?: any
  ): Promise<{ authToken: UserAuthToken; refreshToken: UserAuthRefreshToken }>

  // ==== READ
  getByUuid(tokenUuid: string): Promise<UserAuthRefreshToken | null>

  // ==== UPDATE
  rotateTokens(
    options: { refreshToken: string; refreshTokenProps: UserAuthRefreshTokenProps },
    dbClient?: any
  ): Promise<{
    authToken: UserAuthToken
    refreshToken: UserAuthRefreshToken
  } | null>
  revoke(options: { tokenUuid: string }): Promise<void>
  revokeAll(options: { userUuid: string }): Promise<void>

  // ==== DELETE
  deleteExpired(): Promise<number>

  // ==== UTIL
  verifyAuthToken<P extends UserTokenPayload>(token: string): P
}
