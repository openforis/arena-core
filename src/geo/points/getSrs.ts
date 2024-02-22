import { DEFAULT_SRS, SRS, SRSIndex } from '../../srs'

export const getSrs = (params: { code: string; srsIndex: SRSIndex }): SRS | undefined => {
  const { code, srsIndex } = params
  if (code === DEFAULT_SRS.code) {
    return DEFAULT_SRS
  }
  return srsIndex[code]
}
