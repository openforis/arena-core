import { SRS } from './srs'
import { SRSCache } from './srsCache'

const getSRSByCode = async (code: string): Promise<SRS | undefined> => (await SRSCache.getMap())[code]

/**
 * Finds a list of srs whose name or code matches the specified parameter.
 *
 * @param {!string} codeOrName - Code or name of the SRS to find.
 * @param {number} limit - Maximum number of items to return.
 * @returns {Promise<SRS[]>} - List of SRS matching the specified code or name.
 */
const findSRSByCodeOrName = async (codeOrName: string, limit = 200): Promise<SRS[]> => {
  const srsArray = await SRSCache.getArray()

  const contains = (string: string, value: string) => string.indexOf(value) >= 0
  const codeOrNameLowerCase = codeOrName.toLocaleLowerCase()

  return srsArray
    .filter(
      (srs) =>
        contains(srs.code.toLowerCase(), codeOrNameLowerCase) || contains(srs.name.toLowerCase(), codeOrNameLowerCase)
    )
    .slice(0, limit)
}

export const SRSs = {
  findSRSByCodeOrName,
  getSRSByCode,
}
