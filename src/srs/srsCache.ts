import { SRSFactory } from './factory'
import { SRS } from './srs'

let SRS_MAP: { [code: string]: SRS }
let SRS_ARRAY: SRS[]

const init = async (): Promise<void> => {
  if (!SRS_MAP) {
    SRS_MAP = {}
    const addCrs = (crs: { name: string; wkid: number; wkt: string }): void => {
      const { name, wkid, wkt } = crs
      const code: string = wkid.toString()
      const formatName = (name = ''): string => name.replace(/_/g, ' ')
      SRS_MAP[code] = SRSFactory.createInstance({ code, name: formatName(name), wkt })
    }

    const [{ GeographicCoordinateSystems }, { ProjectedCoordinateSystems }] = await Promise.all([
      import('@esri/proj-codes/pe_list_geogcs.json'),
      import('@esri/proj-codes/pe_list_projcs.json'),
    ])
    GeographicCoordinateSystems.forEach(addCrs)
    ProjectedCoordinateSystems.forEach(addCrs)

    SRS_ARRAY = Object.values(SRS_MAP).sort((srs1, srs2) => srs1.name.localeCompare(srs2.name))
  }
}

const getMap = async (): Promise<{ [code: string]: SRS }> => {
  if (!SRS_MAP) {
    await init()
  }
  return SRS_MAP
}

const getArray = async (): Promise<SRS[]> => {
  if (!SRS_ARRAY) {
    await init()
  }
  return SRS_ARRAY
}

export const SRSCache = {
  getMap,
  getArray,
}
