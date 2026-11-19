import { ArenaTaxon } from './taxon'
import { ArenaVernacularName } from './taxonVernacularName'

const getCode = (taxon: ArenaTaxon) => taxon.props.code
const getScientificName = (taxon: ArenaTaxon) => taxon.props.scientificName
const getVernacularNameByUuid =
  (vernacularNameUuid: string) =>
  (taxon: ArenaTaxon): ArenaVernacularName | undefined => {
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

const getVernacularNameName = (vernacularName: ArenaVernacularName): string | undefined => vernacularName?.props?.name
const getVernacularNameLang = (vernacularName: ArenaVernacularName): string | undefined => vernacularName?.props?.lang

const getVernacularNameAndLang = (vernacularNameUuid: string) => (taxon: ArenaTaxon) => {
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

const isUnknownOrUnlisted = (taxon: ArenaTaxon): boolean => ['UNK', 'UNL'].includes(getCode(taxon))

export const Taxa = {
  getCode,
  getScientificName,
  getVernacularNameByUuid,
  getVernacularNameAndLang,
  isUnknownOrUnlisted,
}
