import { ArenaCategory, ArenaCategoryItem, CategoryItemFactory, ArenaCategoryItemService } from '../../category'

export const categoryItemMock: ArenaCategoryItem = CategoryItemFactory.createInstance({
  levelUuid: 'levelUuid',
  props: { code: 'CODE_MOCK' },
})

export class CategoryItemServiceMock implements ArenaCategoryItemService {
  create(): Promise<{ item: ArenaCategoryItem; category: ArenaCategory }> {
    throw new Error('Not implemented')
  }

  get(): Promise<ArenaCategoryItem> {
    return Promise.resolve(categoryItemMock)
  }

  getMany(): Promise<Array<ArenaCategoryItem>> {
    throw new Error('Not implemented')
  }

  update(): Promise<{ item: ArenaCategoryItem; category: ArenaCategory }> {
    throw new Error('Not implemented')
  }

  delete(): Promise<ArenaCategory> {
    throw new Error('Not implemented')
  }
}
