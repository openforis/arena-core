/**
 * Projected coordinate reference systems
 * format: {wkid: id, name:"CRS name", wkt: "Well Know Text"}.
 */
import * as projected from '@esri/proj-codes/pe_list_projcs.json'
/**
 * Geographic coordinate reference systems
 * format: same as projected.
 */
import * as geographic from '@esri/proj-codes/pe_list_geogcs.json'
import { SRSFactory } from './factory'
import { SRS } from './srs'

const formatName = (name = '') => name.replaceAll('_', ' ')

/**
 * Array of all srs.
 * Every item has this format: {code: epsgCode, name: "Formatted coordinate reference system name"}.
 */
const srsArray = [...projected.ProjectedCoordinateSystems, ...geographic.GeographicCoordinateSystems]
  .map((item) => SRSFactory.createInstance({ code: item.wkid.toString(), name: formatName(item.name), wkt: item.wkt }))
  .sort((srs1, srs2) => {
    // sort SRSs by name
    if (srs1.name > srs2.name) return 1
    if (srs1.name < srs2.name) return -1
    return 0
  })

const srsByCode: { [code: string]: SRS } = srsArray.reduce((srssAcc, srs) => ({ ...srssAcc, [srs.code]: srs }), {})

const getSrsByCode = (code: string) => srsByCode[code]

export const SRSs = {
  getSrsByCode,
}
