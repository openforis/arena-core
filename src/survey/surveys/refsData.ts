import { Survey } from '../survey'
import { CategoryItem } from '../../category'

export const getCategoryItemByCodePaths = (params: {
  survey: Survey
  categoryUuid: string
  codePaths: string[]
}): CategoryItem | undefined => {
  const { survey, categoryUuid, codePaths } = params
  const itemUuid = codePaths.reduce(
    (currentParentUuid: string | undefined, code) =>
      currentParentUuid
        ? survey.refData?.categoryItemUuidIndex?.[categoryUuid]?.[currentParentUuid]?.[code]
        : undefined,
    'null'
  )
  return itemUuid ? survey.refData?.categoryItemIndex[itemUuid] : undefined
}
