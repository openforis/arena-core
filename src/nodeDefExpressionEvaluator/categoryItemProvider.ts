import { CategoryItem } from '../category'
import { Survey } from '../survey'

export interface CategoryItemProvider {
  getItemByCodePaths: (params: {
    survey: Survey
    categoryUuid: string
    codePaths: string[]
    draft?: boolean
  }) => Promise<CategoryItem | undefined>
  getItemByUuid: (params: {
    survey: Survey
    categoryUuid: string
    itemUuid: string
    draft?: boolean
  }) => Promise<CategoryItem | undefined>
  getItems: (params: {
    survey: Survey
    categoryUuid: string
    parentItemUuid?: string
    draft?: boolean
  }) => Promise<CategoryItem[]>
}
