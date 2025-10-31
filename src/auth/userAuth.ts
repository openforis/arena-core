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

export type UserAuthTokenPayload = {
  userUuid: string
  uuid?: string
  exp: number
  iat: number
}

export type UserAuthRefreshTokenPayload = {
  uuid: string
  userUuid: string
  exp: number
  iat: number
}
