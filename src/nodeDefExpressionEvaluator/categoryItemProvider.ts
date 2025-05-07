import { CategoryItem } from '../category'
import { Survey } from '../survey'

export interface CategoryItemProvider {
  getItemByCodePaths: (params: {
    survey: Survey
    categoryUuid: string
    codePaths: string[]
  }) => Promise<CategoryItem | undefined>
  getItemByUuid: (params: {
    survey: Survey
    categoryUuid: string
    itemUuid: string
  }) => Promise<CategoryItem | undefined>
}
