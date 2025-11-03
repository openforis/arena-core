type UserToken = {
  token: string
  dateCreated: Date
  expiresAt: Date
}

export type UserAuthToken = UserToken

export type UserAuthRefreshTokenProps = {
  ipAddress?: string
  userAgent?: string
}

export type UserAuthRefreshToken = UserToken & {
  uuid: string
  userUuid: string
  props: UserAuthRefreshTokenProps
  revoked?: boolean
}

export type UserTokenPayload = {
  userUuid: string
  exp: number
  iat: number
}

export type UserAuthTokenPayload = UserTokenPayload & {
  uuid?: string
}

export type UserAuthRefreshTokenPayload = UserTokenPayload & {
  uuid: string
}
