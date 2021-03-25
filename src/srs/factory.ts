import { Factory } from 'src/common'
import { SRS } from './srs'

export type SRSFactoryParams = {
  code: string
  name: string
  wkt: string
}

export const SRSFactory: Factory<SRS, SRSFactoryParams> = {
  createInstance: (params: SRSFactoryParams): SRS => {
    const { code, name, wkt } = params

    return { code, name, wkt }
  },
}
