import { ArenaFactory } from '../common'
import { ArenaSRS } from './srs'

export type SRSFactoryParams = {
  code: string
  name: string
  wkt: string
}

export const SRSFactory: ArenaFactory<ArenaSRS, SRSFactoryParams> = {
  createInstance: (params: SRSFactoryParams): ArenaSRS => {
    const { code, name, wkt } = params

    return { code, name, wkt }
  },
}
