import { Taxon } from './taxon'

const getCode = (taxon: Taxon) => taxon.props.code
const getScientificName = (taxon: Taxon) => taxon.props.scientificName

export const Taxa = {
  getCode,
  getScientificName,
}
