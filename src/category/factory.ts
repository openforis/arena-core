import { Factory } from 'src/common'
import { v4 as uuidv4 } from 'uuid'
import { Category } from './category'
import { CategoryItem, CategoryItemProps } from './item'
import { CategoryLevel, CategoryLevelProps } from './level'

export type CategoryFactoryParams = {
  props?: {
    name?: string
  }
  levels?: CategoryLevel[]
  published?: boolean
}

export const CategoryFactory: Factory<Category> = {
  createInstance: (params?: CategoryFactoryParams): Category => {
    const defaultProps = {
      props: {},
      levels: [], // TODO: Use levels factory
    }

    const { published, props, levels } = {
      ...defaultProps,
      ...params,
    }

    return {
      levels,
      props,
      published,
      uuid: uuidv4(),
    }
  },
}

export type CategoryLevelFactoryParams = {
  index: number
  props: CategoryLevelProps
  categoryUuid: string
}

export const CategoryLevelFactory: Factory<CategoryLevel> = {
  createInstance: (params?: CategoryLevelFactoryParams): CategoryLevel => {
    const defaultProps = {
      props: {},
      index: undefined,
    }

    const { index, categoryUuid, props } = {
      ...defaultProps,
      ...params,
    }

    return {
      categoryUuid,
      index,
      props,
      uuid: uuidv4(),
    }
  },
}

export type CategoryItemFactoryParams = {
  levelUuid: string
  parentUuid?: string
  props?: CategoryItemProps
}

export const CategoryItemFactory: Factory<CategoryItem> = {
  createInstance: (params?: CategoryItemFactoryParams): CategoryItem => {
    const defaultProps = {
      props: {},
      parentUuid: undefined,
    }

    const { levelUuid, parentUuid, props } = {
      ...defaultProps,
      ...params,
    }

    return {
      uuid: uuidv4(),
      levelUuid,
      parentUuid,
      props,
    }
  },
}
