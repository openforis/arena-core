import { Taxonomy, TaxonomyFactory, TaxonomyService } from '../../taxonomy'

export const taxonomyMock: Taxonomy = TaxonomyFactory.createInstance({})

export class TaxonomyServiceMock implements TaxonomyService {
  count(): Promise<number> {
    throw new Error('Not implemented')
  }

  create(): Promise<Taxonomy> {
    throw new Error('Not implemented')
  }

  delete(): void {
    throw new Error('Not implemented')
  }

  get(): Promise<Taxonomy> {
    return Promise.resolve(taxonomyMock)
  }

  getMany(): Promise<Array<Taxonomy>> {
    throw new Error('Not implemented')
  }

  update(): Promise<void> {
    throw new Error('Not implemented')
  }
}
