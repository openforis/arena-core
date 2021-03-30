import { Taxon, TaxonFactory, TaxonService, VernacularName } from '../../taxonomy'
import { JobSummary } from '../../job'

export const taxonMock: Taxon = TaxonFactory.createInstance({
  props: {
    genus: 'GENUS',
    code: 'CODE',
    family: 'family',
    scientificName: 'scientificName',
  },
  taxonomyUuid: 'taxonomyUuid',
})

export class TaxonServiceMock implements TaxonService {
  count(): Promise<number> {
    throw new Error('Not implemented')
  }

  get(): Promise<Taxon> {
    return Promise.resolve(taxonMock)
  }

  getMany(): Promise<Array<Taxon>> {
    throw new Error('Not implemented')
  }

  getManyVernacularNames(): Promise<Array<VernacularName>> {
    throw new Error('Not implemented')
  }

  importTaxa(): Promise<JobSummary<any>> {
    throw new Error('Not implemented')
  }
}
