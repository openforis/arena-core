import { ArenaDictionary, ArenaFactory } from '../common'
import { UUIDs } from '../utils'
import { ArenaCategory, ArenaCategoryProps } from './category'
import { ArenaCategoryItem, ArenaCategoryItemProps } from './item'
import { ArenaCategoryLevel, ArenaCategoryLevelProps } from './level'

export type CategoryFactoryParams = {
  props?: ArenaCategoryProps
  levels?: ArenaDictionary<ArenaCategoryLevel>
  published?: boolean
}

export const CategoryFactory: ArenaFactory<ArenaCategory, CategoryFactoryParams> = {
  createInstance: (params?: CategoryFactoryParams): ArenaCategory => {
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
  props?: ArenaCategoryLevelProps
  categoryUuid: string
}

export const CategoryLevelFactory: ArenaFactory<ArenaCategoryLevel, CategoryLevelFactoryParams> = {
  createInstance: (params?: CategoryLevelFactoryParams): ArenaCategoryLevel => {
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
  props?: ArenaCategoryItemProps
}

export const CategoryItemFactory: ArenaFactory<ArenaCategoryItem, CategoryItemFactoryParams> = {
  createInstance: (params?: CategoryItemFactoryParams): ArenaCategoryItem => {
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
