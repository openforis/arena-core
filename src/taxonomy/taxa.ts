import { Taxon } from './taxon'

const getCode = (taxon: Taxon) => taxon.props.code

export const Taxa = {
  getCode,
}
