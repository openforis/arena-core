import { Category, CategoryLevel, CategoryLevelFactory, CategoryLevelService } from '../../category'

export const categoryLevelMock: CategoryLevel = CategoryLevelFactory.createInstance()

export class CategoryLevelServiceMock implements CategoryLevelService {
  create(): Promise<{ level: CategoryLevel; category: Category }> {
    throw new Error('Not implemented')
  }

  get(): Promise<CategoryLevel> {
    return Promise.resolve(categoryLevelMock)
  }

  getMany(): Promise<Array<CategoryLevel>> {
    throw new Error('Not implemented')
  }

  update(): Promise<{ level: CategoryLevel; category: Category }> {
    throw new Error('Not implemented')
  }

  delete(): Promise<Category> {
    throw new Error('Not implemented')
  }
}
