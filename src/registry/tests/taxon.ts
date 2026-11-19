import { ArenaTaxon, TaxonFactory, ArenaTaxonService, ArenaVernacularName } from '../../taxonomy'
import { ArenaJobSerialized } from '../../job'

export const taxonMock: ArenaTaxon = TaxonFactory.createInstance({
  props: {
    genus: 'GENUS',
    code: 'CODE',
    family: 'family',
    scientificName: 'scientificName',
  },
  taxonomyUuid: 'taxonomyUuid',
})

export class TaxonServiceMock implements ArenaTaxonService {
  count(): Promise<number> {
    throw new Error('Not implemented')
  }

  get(): Promise<ArenaTaxon> {
    return Promise.resolve(taxonMock)
  }

  getMany(): Promise<Array<ArenaTaxon>> {
    throw new Error('Not implemented')
  }

  getManyVernacularNames(): Promise<Array<ArenaVernacularName>> {
    throw new Error('Not implemented')
  }

  importTaxa(): Promise<ArenaJobSerialized<any>> {
    throw new Error('Not implemented')
  }
}
