import { Dictionary, Factory } from '../common'
import { UUIDs } from '../utils'
import { Category, CategoryProps } from './category'
import { CategoryItem, CategoryItemProps } from './item'
import { CategoryLevel, CategoryLevelProps } from './level'

export type CategoryFactoryParams = {
  props?: CategoryProps
  levels?: Dictionary<CategoryLevel>
  published?: boolean
}

export const CategoryFactory: Factory<Category, CategoryFactoryParams> = {
  createInstance: (params?: CategoryFactoryParams): Category => {
    const defaultProps = {
      props: {},
    }

    const { published, props, levels } = {
      ...defaultProps,
      ...params,
    }

    const category = {
      levels,
      props,
      published,
      uuid: UUIDs.v4(),
    }
    return {
      ...category,
      levels: levels ?? {
        0: CategoryLevelFactory.createInstance({ categoryUuid: category.uuid, index: 0, props: { name: 'level_1' } }),
      },
    }
  },
}

export type CategoryLevelFactoryParams = {
  index?: number
  props?: CategoryLevelProps
  categoryUuid: string
}

export const CategoryLevelFactory: Factory<CategoryLevel, CategoryLevelFactoryParams> = {
  createInstance: (params?: CategoryLevelFactoryParams): CategoryLevel => {
    const defaultProps = {
      props: {},
      index: 0,
    }

    const { index, categoryUuid, props } = {
      ...defaultProps,
      ...params,
    }

    return {
      categoryUuid,
      index,
      props,
      uuid: UUIDs.v4(),
    }
  },
}

export type CategoryItemFactoryParams = {
  levelUuid: string
  parentUuid?: string
  props?: CategoryItemProps
}

export const CategoryItemFactory: Factory<CategoryItem, CategoryItemFactoryParams> = {
  createInstance: (params?: CategoryItemFactoryParams): CategoryItem => {
    const defaultProps = {
      props: {},
    }

    const { levelUuid, parentUuid, props } = {
      ...defaultProps,
      ...params,
    }

    return {
      uuid: UUIDs.v4(),
      levelUuid,
      parentUuid,
      props,
    }
  },
}
