import { Category, CategoryItem, CategoryItemFactory, CategoryItemService } from '../../category'

export const categoryItemMock: CategoryItem = CategoryItemFactory.createInstance({
  levelUuid: 'levelUuid',
  props: { code: 'CODE_MOCK' },
})

export class CategoryItemServiceMock implements CategoryItemService {
  create(): Promise<{ item: CategoryItem; category: Category }> {
    throw new Error('Not implemented')
  }

  get(): Promise<CategoryItem> {
    return Promise.resolve(categoryItemMock)
  }

  getMany(): Promise<Array<CategoryItem>> {
    throw new Error('Not implemented')
  }

  update(): Promise<{ item: CategoryItem; category: Category }> {
    throw new Error('Not implemented')
  }

  delete(): Promise<Category> {
    throw new Error('Not implemented')
  }
}
