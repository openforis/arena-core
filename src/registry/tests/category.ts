import { ArenaCategory, CategoryFactory, ArenaCategoryService, ArenaCategoryImportSummary } from '../../category'
import { ArenaJobSerialized } from '../../job'

export const categoryMock: ArenaCategory = CategoryFactory.createInstance({ props: { name: 'category_mock' } })

export class CategoryServiceMock implements ArenaCategoryService {
  create(): Promise<ArenaCategory> {
    throw new Error('Not implemented')
  }

  createImportSummary(): Promise<ArenaCategoryImportSummary> {
    throw new Error('Not implemented')
  }

  createImportCategory(): Promise<ArenaJobSerialized<any>> {
    throw new Error('Not implemented')
  }

  count(): Promise<number> {
    throw new Error('Not implemented')
  }

  get(): Promise<ArenaCategory> {
    return Promise.resolve(categoryMock)
  }

  getMany(): Promise<Array<ArenaCategory>> {
    throw new Error('Not implemented')
  }

  update(): Promise<ArenaCategory> {
    throw new Error('Not implemented')
  }

  delete(): Promise<void> {
    throw new Error('Not implemented')
  }
}
