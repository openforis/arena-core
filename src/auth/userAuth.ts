import { AppInfo } from '../app'

export type AuthToken = {
  token: string
  dateCreated: Date
  expiresAt: Date
}

export type UserAuthRefreshTokenProps = {
  appInfo?: AppInfo
  ipAddress?: string
  userAgent?: string
}

export type UserAuthRefreshToken = AuthToken & {
  uuid: string
  userUuid: string
  props: UserAuthRefreshTokenProps
  revoked?: boolean
}

export type UserTokenPayload = {
  userUuid: string
}

export type UserAuthTokenPayload = UserTokenPayload & {
  uuid?: string
}

export type UserAuthRefreshTokenPayload = UserTokenPayload & {
  uuid: string
}

export type DownloadAuthTokenPayload = UserTokenPayload & {
  fileName: string
}
