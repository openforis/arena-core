import { SRS } from './srs'
import { SRSFactory } from './factory'

const formatName = (name = ''): string => name.replace(/_/g, ' ')

let SRS_MAP: { [code: string]: SRS }
let SRS_ARRAY: SRS[]

const addCrs = (crs: { name: string; wkid: number; wkt: string }): void => {
  const { name, wkid, wkt } = crs
  const code: string = wkid.toString()
  SRS_MAP[code] = SRSFactory.createInstance({ code, name: formatName(name), wkt })
}

const init = async (): Promise<void> => {
  if (!SRS_MAP) {
    SRS_MAP = {}

    const listGeocs = await import('@esri/proj-codes/pe_list_geogcs.json')
    listGeocs.GeographicCoordinateSystems.forEach(addCrs)

    const projcs = await import('@esri/proj-codes/pe_list_projcs.json')
    projcs.ProjectedCoordinateSystems.forEach(addCrs)

    SRS_ARRAY = Object.values(SRS_MAP).sort((srs1, srs2) => srs1.name.localeCompare(srs2.name))
  }
}

const _convertToSRSObject = (crs: any) => {
  const { name, wkid, wkt } = crs
  const code: string = wkid.toString()
  return SRSFactory.createInstance({ code, name: formatName(name), wkt })
}

const fetchSRSs = async (): Promise<SRS[]> => {
  const result: SRS[] = []
  const _addCrs = (crs: any) => result.push(_convertToSRSObject(crs))

  const listGeocs = await import('@esri/proj-codes/pe_list_geogcs.json')
  listGeocs.GeographicCoordinateSystems.forEach(_addCrs)
  const projcs = await import('@esri/proj-codes/pe_list_projcs.json')
  projcs.ProjectedCoordinateSystems.forEach(_addCrs)

  return result
}

const getSRSByCode = (code: string): SRS | undefined => {
  if (!SRS_MAP) throw new Error('SRSs not initialized. Call SRSs.init() first')
  return SRS_MAP[code]
}

/**
 * Finds a list of srs whose name or code matches the specified parameter.
 *
 * @param {!string} codeOrName - Code or name of the SRS to find.
 * @param {number} limit - Maximum number of items to return.
 * @returns {SRS[]} - List of SRS matching the specified code or name.
 */
const findSRSByCodeOrName = (codeOrName: string, limit = 200): SRS[] => {
  const contains = (string: string, value: string) => string.indexOf(value) >= 0
  const codeOrNameLowerCase = codeOrName.toLocaleLowerCase()
  return SRS_ARRAY.filter(
    (srs) =>
      contains(srs.code.toLowerCase(), codeOrNameLowerCase) || contains(srs.name.toLowerCase(), codeOrNameLowerCase)
  ).slice(0, limit)
}

export const SRSs = {
  fetchSRSs,
  findSRSByCodeOrName,
  getSRSByCode,
  init,
}
