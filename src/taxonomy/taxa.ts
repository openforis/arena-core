import { Taxon } from './taxon'
import { VernacularName } from './taxonVernacularName'

const getCode = (taxon: Taxon) => taxon.props.code
const getScientificName = (taxon: Taxon) => taxon.props.scientificName
const getVernacularNameByUuid =
  (vernacularNameUuid: string) =>
  (taxon: Taxon): VernacularName | undefined => {
    const vernacularNamesByLang = taxon?.vernacularNames ?? {}
    const vernacularNameArrays = Object.values(vernacularNamesByLang)
    for (const vernacularNameArray of vernacularNameArrays) {
      for (const vernacularName of vernacularNameArray) {
        if (vernacularName.uuid === vernacularNameUuid) {
          return vernacularName
        }
      }
    }
    return undefined
  }

const getVernacularNameName = (vernacularName: VernacularName): string | undefined => vernacularName?.props?.name
const getVernacularNameLang = (vernacularName: VernacularName): string | undefined => vernacularName?.props?.lang

const getVernacularNameAndLang = (vernacularNameUuid: string) => (taxon: Taxon) => {
  let vernacularName, vernacularLang
  const vernacularNameObj = getVernacularNameByUuid(vernacularNameUuid)(taxon)
  if (vernacularNameObj) {
    vernacularName = getVernacularNameName(vernacularNameObj)
    vernacularLang = getVernacularNameLang(vernacularNameObj)
  } else {
    vernacularName = taxon.vernacularName
    vernacularLang = taxon.vernacularLang
  }
  return vernacularName ? { vernacularName, vernacularLang } : {}
}

const isUnknownOrUnlisted = (taxon: Taxon): boolean => ['UNK', 'UNL'].includes(getCode(taxon))

export const Taxa = {
  getCode,
  getScientificName,
  getVernacularNameByUuid,
  getVernacularNameAndLang,
  isUnknownOrUnlisted,
}
