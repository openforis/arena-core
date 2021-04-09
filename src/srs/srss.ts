import { SRS } from './srs'
import { SRSFactory } from './factory'

const formatName = (name = ''): string => name.replace(/_/g, ' ')

let SRS_MAP: { [code: string]: SRS }

const init = async (): Promise<void> => {
  if (!SRS_MAP) {
    SRS_MAP = {}
    const addCrs = (crs: { name: string; wkid: number; wkt: string }): void => {
      const { name, wkid, wkt } = crs
      const code: string = wkid.toString()
      SRS_MAP[code] = SRSFactory.createInstance({ code, name: formatName(name), wkt })
    }

    const [{ GeographicCoordinateSystems }, { ProjectedCoordinateSystems }] = await Promise.all([
      import('@esri/proj-codes/pe_list_geogcs.json'),
      import('@esri/proj-codes/pe_list_projcs.json'),
    ])
    GeographicCoordinateSystems.forEach(addCrs)
    ProjectedCoordinateSystems.forEach(addCrs)
  }
}

const getSRSByCode = (code: string): SRS | undefined => {
  if (!SRS_MAP) throw new Error('SRSs not initialized. Call SRSs.init() first')
  return SRS_MAP[code]
}

export const SRSs = {
  getSRSByCode,
  init,
}
