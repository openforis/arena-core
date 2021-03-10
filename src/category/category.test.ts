import { CategoryFactory, CategoryFactoryParams, CategoryItemFactory, CategoryLevelFactory } from './factory'
import { LanguageCode } from 'src/language'

test('ExpectedCategory === Category', () => {
  const categoryParams: CategoryFactoryParams = {
    props: {
      name: 'name',
    },
  }

  const category = CategoryFactory.createInstance(categoryParams)

  expect(category).toHaveProperty('props')
  expect(category.props).toHaveProperty('name')
  expect(category.props.name).toBe('name')
})

test('ExpectedCategory === Category', () => {
  const category = CategoryFactory.createInstance()

  expect(category).toHaveProperty('props')
  expect(category.props).not.toHaveProperty('name')
})

test('ExpectedCategoryLevel === CategoryLevel', () => {
  const categoryLevel = CategoryLevelFactory.createInstance({ index: 1, props: { name: 'name' }, categoryUuid: 'uuid' })

  expect(categoryLevel).toHaveProperty('categoryUuid')
  expect(categoryLevel.categoryUuid).toBeTruthy()

  expect(categoryLevel).toHaveProperty('index')
  expect(categoryLevel.index).toBe(1)

  expect(categoryLevel).toHaveProperty('props')
  expect(categoryLevel.props).toHaveProperty('name')
  expect(categoryLevel.props.name).toBeTruthy()
})

test('ExpectedCategoryItem === CategoryItem', () => {
  const categoryItem = CategoryItemFactory.createInstance({
    props: {
      code: '001',
      labels: { en: 'Label' },
    },
    levelUuid: 'level_uuid',
    parentUuid: 'parent_uuid',
  })

  expect(categoryItem).toHaveProperty('levelUuid')
  expect(categoryItem.levelUuid).toBe(categoryItem.levelUuid)

  expect(categoryItem).toHaveProperty('parentUuid')
  expect(categoryItem.parentUuid).toBe(categoryItem.parentUuid)

  expect(categoryItem).toHaveProperty('uuid')
  expect(categoryItem.uuid).toBeTruthy()

  expect(categoryItem).toHaveProperty('props')
  expect(categoryItem.props).toHaveProperty('code')
  expect(categoryItem.props.code).toBe(categoryItem.props.code)
  expect(categoryItem.props.labels).toBeTruthy()
  expect(categoryItem.props.labels).toHaveProperty(LanguageCode.en)
  expect(categoryItem.props.labels?.en).toBe(categoryItem.props?.labels?.en)
})
