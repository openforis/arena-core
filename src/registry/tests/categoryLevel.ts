import { ArenaCategory, ArenaCategoryLevel, CategoryLevelFactory, ArenaCategoryLevelService } from '../../category'

export const categoryLevelMock: ArenaCategoryLevel = CategoryLevelFactory.createInstance()

export class CategoryLevelServiceMock implements ArenaCategoryLevelService {
  create(): Promise<{ level: ArenaCategoryLevel; category: ArenaCategory }> {
    throw new Error('Not implemented')
  }

  get(): Promise<ArenaCategoryLevel> {
    return Promise.resolve(categoryLevelMock)
  }

  getMany(): Promise<Array<ArenaCategoryLevel>> {
    throw new Error('Not implemented')
  }

  update(): Promise<{ level: ArenaCategoryLevel; category: ArenaCategory }> {
    throw new Error('Not implemented')
  }

  delete(): Promise<ArenaCategory> {
    throw new Error('Not implemented')
  }
}
