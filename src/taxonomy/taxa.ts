import { Taxon } from './taxon'

const getCode = (taxon: Taxon) => taxon.props.code
const getScientificName = (taxon: Taxon) => taxon.props.scientificName
const getVernacularNameByUuid = (vernacularNameUuid: string) => (taxon: Taxon) => {
  const vernacularNamesByLang = taxon?.vernacularNames ?? {}
  return Object.values(vernacularNamesByLang).find((vernacularNames) =>
    vernacularNames.find((vernacularName) => vernacularName.uuid === vernacularNameUuid)
  )
}

export const Taxa = {
  getCode,
  getScientificName,
  getVernacularNameByUuid,
}
