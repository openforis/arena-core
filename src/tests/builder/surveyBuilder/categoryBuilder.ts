import { Category, CategoryFactory, CategoryItem, CategoryLevel, CategoryLevelFactory } from '../../../category'
import { Dictionary } from '../../../common'
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

  levels(...levelNames: string[]): this {
    this.levelNames = levelNames
    return this
  }

  items(...itemBuilders: CategoryItemBuilder[]): this {
    this.itemBuilders = [...itemBuilders]
    return this
  }

  extraProps(extraPropsDefs: ExtraPropDefs): this {
    this._extraProps = extraPropsDefs
    return this
  }

  build(): { category: Category; items: CategoryItem[] } {
    const category = CategoryFactory.createInstance({ props: { name: this.name, itemExtraDef: this._extraProps } })
    if (this.levelNames.length > 0) {
      const levels = this.levelNames.reduce((acc: Dictionary<CategoryLevel>, name, index) => {
        acc[index] = CategoryLevelFactory.createInstance({ categoryUuid: category.uuid, props: { name } })
        return acc
      }, {})
      category.levels = levels
    }
    const items = this.itemBuilders.flatMap((itemBuilder) => itemBuilder.build(category))

    return {
      category,
      items,
    }
  }
}
