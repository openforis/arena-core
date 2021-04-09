import { SRS } from './srs'
import { SRSFactory } from './factory'

const formatName = (name = ''): string => name.replace(/_/g, ' ')

let SrsMap: { [code: string]: SRS }

const init = async (): Promise<void> => {
  if (!SrsMap) {
    SrsMap = {}
    const addCrs = (crs: { name: string; wkid: number; wkt: string }): void => {
      const { name, wkid, wkt } = crs
      const code: string = wkid.toString()
      SrsMap[code] = SRSFactory.createInstance({ code, name: formatName(name), wkt })
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
  if (!SrsMap) throw new Error('SRSs not initialized. Call SRSs.init() first')
  return SrsMap[code]
}

export const SRSs = {
  getSRSByCode,
  init,
}
