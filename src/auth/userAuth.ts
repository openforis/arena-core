import { ArenaAppInfo } from '../app'

export type ArenaAuthToken = {
  token: string
  dateCreated: Date
  expiresAt: Date
}

export type ArenaUserAuthRefreshTokenProps = {
  appInfo?: ArenaAppInfo
  ipAddress?: string
  userAgent?: string
}

export type ArenaUserAuthRefreshToken = ArenaAuthToken & {
  uuid: string
  userUuid: string
  props: ArenaUserAuthRefreshTokenProps
  revoked?: boolean
}

export type ArenaUserTokenPayload = {
  userUuid: string
}

export type ArenaUserAuthTokenPayload = ArenaUserTokenPayload & {
  uuid?: string
}

export type ArenaUserAuthRefreshTokenPayload = ArenaUserTokenPayload & {
  uuid: string
}

export type ArenaDownloadAuthTokenPayload = ArenaUserTokenPayload & {
  fileName: string
}
