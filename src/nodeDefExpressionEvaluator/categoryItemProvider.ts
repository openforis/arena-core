import { ArenaCategoryItem } from '../category'
import { ArenaSurvey } from '../survey'

export interface ArenaCategoryItemProvider {
  getItemByCodePaths: (params: {
    survey: ArenaSurvey
    categoryUuid: string
    codePaths: string[]
    draft?: boolean
  }) => Promise<ArenaCategoryItem | undefined>
  getItemByUuid: (params: {
    survey: ArenaSurvey
    categoryUuid: string
    itemUuid: string
    draft?: boolean
  }) => Promise<ArenaCategoryItem | undefined>
  getItems: (params: {
    survey: ArenaSurvey
    categoryUuid: string
    parentItemUuid?: string
    draft?: boolean
  }) => Promise<ArenaCategoryItem[]>
}
