import { ArenaService } from '../common'
import { UserAuthRefreshToken, UserAuthRefreshTokenProps, AuthToken, UserTokenPayload } from './userAuth'

export interface UserAuthTokenService extends ArenaService {
  // ==== CREATE
  /**
   * Create new auth and refresh tokens for the specified user.
   * @param options
   * @param options.userUuid The UUID of the user for whom the tokens are being created.
   * @param options.props Additional properties for the refresh token.
   * @param dbClient Optional database client for transaction management.
   * @returns An object containing the created AuthToken and UserAuthRefreshToken.
   */
  createUserAuthTokens(
    options: { userUuid: string; props: UserAuthRefreshTokenProps },
    dbClient?: any
  ): Promise<{ authToken: AuthToken; refreshToken: UserAuthRefreshToken }>

  /**
   * Create a one-time download auth token for the specified user and file name.
   * @param options
   * @param options.userUuid The UUID of the user for whom the token is being created.
   * @param options.fileName The name of the file to be downloaded.
   * @returns An AuthToken object containing the token string, creation date, and expiration date.
   */
  createDownloadAuthToken(options: { userUuid: string; fileName: string }): AuthToken

  // ==== READ
  getByUuid(tokenUuid: string): Promise<UserAuthRefreshToken | null>

  // ==== UPDATE
  /**
   * Rotate (refresh) the auth and refresh tokens using the provided refresh token.
   * @param options
   * @param options.refreshToken The current refresh token used to obtain new tokens.
   * @param options.refreshTokenProps Additional properties for the new refresh token.
   * @param dbClient Optional database client for transaction management.
   * @returns An object containing the new AuthToken and UserAuthRefreshToken, or null if the refresh token is invalid.
   */
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
  /**
   * Verify the provided auth token and return its payload.
   * @param token The auth token string to verify.
   * @returns The payload of the verified token.
   */
  verifyAuthToken<P extends UserTokenPayload>(token: string): P
}
