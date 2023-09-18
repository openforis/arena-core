import { Category, CategoryItem, CategoryItemFactory } from '../../../category'

export class CategoryItemBuilder {
  private code: string
  private _label?: string
  private extraProps: { [key: string]: any }
  private childItemBuilders: CategoryItemBuilder[]

  constructor(code: string) {
    this.code = code
    this._label = ''
    this.extraProps = {}
    this.childItemBuilders = []
  }

  label(label: string): this {
    this._label = label
    return this
  }

  extra(extraProps: { [key: string]: any }): this {
    this.extraProps = extraProps
    return this
  }

  items(...itemBuilders: CategoryItemBuilder[]): this {
    this.childItemBuilders = [...itemBuilders]
    return this
  }

  build(category: Category, parentItem: CategoryItem | null = null, levelIndex = 0): CategoryItem[] {
    const level = category.levels[levelIndex]
    const item = CategoryItemFactory.createInstance({
      levelUuid: level.uuid,
      parentUuid: parentItem?.uuid,
      props: { code: this.code, labels: { en: this._label }, extra: this.extraProps },
    })
    const descendants = this.childItemBuilders.flatMap((childItemBuilder) =>
      childItemBuilder.build(category, item, levelIndex + 1)
    )
    return [item, ...descendants]
  }
}
