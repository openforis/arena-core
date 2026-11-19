import { DEFAULT_SRS, ArenaSRS, ArenaSRSIndex } from '../../srs'

export const getSrs = (params: { code: string; srsIndex: ArenaSRSIndex }): ArenaSRS | undefined => {
  const { code, srsIndex } = params
  if (code === DEFAULT_SRS.code) {
    return DEFAULT_SRS
  }
  return srsIndex[code]
}
