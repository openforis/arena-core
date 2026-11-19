import {
  ArenaCategory,
  CategoryFactory,
  ArenaCategoryItem,
  ArenaCategoryLevel,
  CategoryLevelFactory,
} from '../../../category'
import { ArenaDictionary } from '../../../common'
import { ArenaExtraPropDefs } from '../../../extraProp'
import { CategoryItemBuilder } from './categoryItemBuilder'

export class CategoryBuilder {
  private readonly name: string
  private itemBuilders: CategoryItemBuilder[]
  private levelNames: string[]
  private _extraProps: ArenaExtraPropDefs

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

  extraProps(extraPropsDefs: ArenaExtraPropDefs): this {
    this._extraProps = extraPropsDefs
    return this
  }

  build(): { category: ArenaCategory; items: ArenaCategoryItem[] } {
    const category = CategoryFactory.createInstance({ props: { name: this.name, itemExtraDef: this._extraProps } })
    if (this.levelNames.length > 0) {
      const levels = this.levelNames.reduce((acc: ArenaDictionary<ArenaCategoryLevel>, name, index) => {
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
