import { Category, CategoryFactory, CategoryService, CategoryImportSummary } from '../../category'
import { JobSummary } from '../../job'

export const categoryMock: Category = CategoryFactory.createInstance()

export class CategoryServiceMock implements CategoryService {
  create(): Promise<Category> {
    throw new Error('Not implemented')
  }

  createImportSummary(): Promise<CategoryImportSummary> {
    throw new Error('Not implemented')
  }

  createImportCategory(): Promise<JobSummary<any>> {
    throw new Error('Not implemented')
  }

  count(): Promise<number> {
    throw new Error('Not implemented')
  }

  get(): Promise<Category> {
    return Promise.resolve(categoryMock)
  }

  getMany(): Promise<Array<Category>> {
    throw new Error('Not implemented')
  }

  update(): Promise<Category> {
    throw new Error('Not implemented')
  }

  delete(): Promise<void> {
    throw new Error('Not implemented')
  }
}
