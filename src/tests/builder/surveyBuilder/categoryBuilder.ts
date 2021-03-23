import { Category, CategoryFactory, CategoryItem, CategoryLevelFactory } from '../../../category'
import { CategoryItemBuilder } from './categoryItemBuilder'

export class CategoryBuilder {
  private name: string
  private itemBuilders: CategoryItemBuilder[]
  private levelNames: string[]

  constructor(name: string, ...itemBuilders: CategoryItemBuilder[]) {
    this.name = name
    this.itemBuilders = itemBuilders
    this.levelNames = []
  }

  levels(...levelNames: string[]): CategoryBuilder {
    this.levelNames = levelNames
    return this
  }

  build(): { category: Category; items: CategoryItem[] } {
    const category = CategoryFactory.createInstance({ props: { name: this.name } })
    if (this.levelNames.length > 0) {
      const levels = this.levelNames.map((name) =>
        CategoryLevelFactory.createInstance({ categoryUuid: category.uuid, props: { name } })
      )
      category.levels = levels
    }
    const items = this.itemBuilders.flatMap((itemBuilder) => itemBuilder.build(category))

    return {
      category,
      items,
    }
  }
}
