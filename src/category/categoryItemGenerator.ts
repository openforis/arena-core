import { Categories } from './categories'
import { CategoryItem } from './item'
import { ExtraPropsDataGenerator } from '../extraProp'
import { Survey, Surveys } from '../survey'
import { UUIDs } from '../utils'

const generateItem = (params: { survey: Survey; categoryUuid: string }): CategoryItem | null => {
  const { survey, categoryUuid } = params
  const category = categoryUuid ? Surveys.getCategoryByUuid({ survey, categoryUuid }) : null
  if (!category) return null
  const extraPropDefs = Categories.getExtraPropDefs(category)

  const item: CategoryItem = {
    uuid: UUIDs.v4(),
    props: { code: 'ABC' },
  }
  if (extraPropDefs) {
    item.props.extra = ExtraPropsDataGenerator.generateData({ extraPropDefs })
  }
  return item
}

export const CategoryItemGenerator = {
  generateItem,
}
