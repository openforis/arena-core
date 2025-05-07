import { CategoryItem } from '../category'
import { Survey } from '../survey'

export interface CategoryItemProvider {
  getCategoryItemByCodePaths: (params: {
    survey: Survey
    categoryUuid: string
    codePaths: string[]
  }) => CategoryItem | undefined
}
