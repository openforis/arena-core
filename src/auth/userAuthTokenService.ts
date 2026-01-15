import { ArenaService } from '../common'
import { UserAuthRefreshToken, UserAuthRefreshTokenProps, AuthToken, UserTokenPayload } from './userAuth'

export interface UserAuthTokenService extends ArenaService {
  // ==== CREATE
  createUserAuthTokens(
    options: { userUuid: string; props: UserAuthRefreshTokenProps },
    dbClient?: any
  ): Promise<{ authToken: AuthToken; refreshToken: UserAuthRefreshToken }>

  createDownloadAuthToken(options: { userUuid: string; fileName: string }): Promise<AuthToken>

  // ==== READ
  getByUuid(tokenUuid: string): Promise<UserAuthRefreshToken | null>

  // ==== UPDATE
  rotateTokens(
    options: { refreshToken: string; refreshTokenProps: UserAuthRefreshTokenProps },
    dbClient?: any
  ): Promise<{
    authToken: AuthToken
    refreshToken: UserAuthRefreshToken
  } | null>
  revoke(options: { tokenUuid: string }): Promise<void>
  revokeAll(options: { userUuid: string }): Promise<void>

  // ==== DELETE
  deleteExpired(): Promise<number>

  // ==== UTIL
  verifyAuthToken<P extends UserTokenPayload>(token: string): P
}
