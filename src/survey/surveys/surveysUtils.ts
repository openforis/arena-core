import { ArenaCategoryItem } from '../../category'
import { ArenaDictionary } from '../../common'
import { ArenaNodeDef, ArenaNodeDefCode, NodeDefs } from '../../nodeDef'
import { ArenaSurvey, SurveyDependencyType } from '../survey'
import { getNodeDefDependents } from './dependencies'
import { getCategoryItems } from './refsData'

export const getEnumeratingCategoryItems = (params: {
  survey: ArenaSurvey
  enumerator: ArenaNodeDefCode
  parentItemUuid?: string
}): ArenaCategoryItem[] => {
  const { survey, enumerator, parentItemUuid } = params
  const categoryUuid = NodeDefs.getCategoryUuid(enumerator)!
  const category = survey.categories?.[categoryUuid]
  if (!category || (NodeDefs.getParentCodeDefUuid(enumerator) && !parentItemUuid)) {
    return []
  }
  return getCategoryItems({ survey, categoryUuid: category.uuid, parentItemUuid })
}

export const findApplicableDependentEnumeratedEntityDefs = (nodeDef: ArenaNodeDef<any>) => (survey: ArenaSurvey) => {
  const result = []
  const visitedNodeDefsByUuid: ArenaDictionary<boolean> = {}
  const stack = [nodeDef]
  while (stack.length > 0) {
    const currentNodeDef = stack.pop()!
    const { uuid: currentNodeDefUuid } = currentNodeDef
    if (!visitedNodeDefsByUuid[currentNodeDefUuid]) {
      if (NodeDefs.isEntity(currentNodeDef) && NodeDefs.isEnumerate(currentNodeDef)) {
        result.push(currentNodeDef)
      }
      const dependencyTypes = [SurveyDependencyType.applicable, SurveyDependencyType.defaultValues]
      const dependents = dependencyTypes.reduce((acc: ArenaNodeDef<any>[], dependencyType) => {
        const dependentsPartial = getNodeDefDependents({
          survey,
          nodeDefUuid: currentNodeDefUuid,
          dependencyType,
        })
        acc.push(...dependentsPartial)
        return acc
      }, [])
      stack.push(...dependents)
    }
    visitedNodeDefsByUuid[currentNodeDefUuid] = true
  }
  return result
}
