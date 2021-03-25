/**
 * Geographic coordinate reference systems
 * format: same as projected.
 */
import { GeographicCoordinateSystems } from '@esri/proj-codes/pe_list_geogcs.json'
/**
 * Projected coordinate reference systems
 * format: {wkid: id, name:"CRS name", wkt: "Well Know Text"}.
 */
import { ProjectedCoordinateSystems } from '@esri/proj-codes/pe_list_projcs.json'

import { SRSFactory } from './factory'
import { SRS } from './srs'

const formatName = (name = ''): string => name.replace(/_/g, ' ')

/**
 * Array of all srs.
 * Every item has this format: {code: epsgCode, name: "Formatted coordinate reference system name"}.
 */
const srsArray: SRS[] = [...ProjectedCoordinateSystems, ...GeographicCoordinateSystems]
  .map((item) => {
    const { name, wkid, wkt } = item
    return SRSFactory.createInstance({ code: wkid.toString(), name: formatName(name), wkt })
  })
  .sort((srs1, srs2) => {
    // sort SRSs by name
    if (srs1.name > srs2.name) return 1
    if (srs1.name < srs2.name) return -1
    return 0
  })

const srsByCode: { [code: string]: SRS } = srsArray.reduce((srssAcc, srs) => ({ ...srssAcc, [srs.code]: srs }), {})

const getSRSByCode = (code: string): SRS => {
  const srs = srsByCode[code]
  if (!srs) throw new Error(`SRS with code '${code}' not found`)
  return srs
}

export const SRSs = {
  getSRSByCode,
}
