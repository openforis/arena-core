import { Category, CategoryFactory, CategoryItem, CategoryLevelFactory } from '../../../category'
import { ExtraPropDefs } from '../../../extraProp'
import { CategoryItemBuilder } from './categoryItemBuilder'

export class CategoryBuilder {
  private name: string
  private itemBuilders: CategoryItemBuilder[]
  private levelNames: string[]
  private _extraProps: ExtraPropDefs

  constructor(name: string) {
    this.name = name
    this.levelNames = []
    this.itemBuilders = []
    this._extraProps = {}
  }

  levels(...levelNames: string[]): CategoryBuilder {
    this.levelNames = levelNames
    return this
  }

  items(...itemBuilders: CategoryItemBuilder[]): CategoryBuilder {
    this.itemBuilders = [...itemBuilders]
    return this
  }

  extraProps(extraPropsDefs: ExtraPropDefs): CategoryBuilder {
    this._extraProps = extraPropsDefs
    return this
  }

  build(): { category: Category; items: CategoryItem[] } {
    const category = CategoryFactory.createInstance({ props: { name: this.name, itemExtraDefs: this._extraProps } })
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
