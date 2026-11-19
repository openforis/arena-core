import { ArenaTaxonomy, TaxonomyFactory, ArenaTaxonomyService } from '../../taxonomy'

export const taxonomyMock: ArenaTaxonomy = TaxonomyFactory.createInstance({})

export class TaxonomyServiceMock implements ArenaTaxonomyService {
  count(): Promise<number> {
    throw new Error('Not implemented')
  }

  create(): Promise<ArenaTaxonomy> {
    throw new Error('Not implemented')
  }

  delete(): void {
    throw new Error('Not implemented')
  }

  get(): Promise<ArenaTaxonomy> {
    return Promise.resolve(taxonomyMock)
  }

  getMany(): Promise<Array<ArenaTaxonomy>> {
    throw new Error('Not implemented')
  }

  update(): Promise<void> {
    throw new Error('Not implemented')
  }
}
