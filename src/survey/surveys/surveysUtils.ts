import { CategoryItem } from '../../category'
import { Dictionary } from '../../common'
import { NodeDef, NodeDefCode, NodeDefs } from '../../nodeDef'
import { Survey, SurveyDependencyType } from '../survey'
import { getNodeDefDependents } from './dependencies'
import { getCategoryItems } from './refsData'

export const getEnumeratingCategoryItems = (params: {
  survey: Survey
  enumerator: NodeDefCode
  parentItemUuid?: string
}): CategoryItem[] => {
  const { survey, enumerator, parentItemUuid } = params
  const categoryUuid = NodeDefs.getCategoryUuid(enumerator)!
  const category = survey.categories?.[categoryUuid]
  if (!category || (NodeDefs.getParentCodeDefUuid(enumerator) && !parentItemUuid)) {
    return []
  }
  return getCategoryItems({ survey, categoryUuid: category.uuid, parentItemUuid })
}

export const findApplicableDependentEnumeratedEntityDefs = (nodeDef: NodeDef<any>) => (survey: Survey) => {
  const result = []
  const visitedNodeDefsByUuid: Dictionary<boolean> = {}
  const stack = [nodeDef]
  while (stack.length > 0) {
    const currentNodeDef = stack.pop()!
    const { uuid: currentNodeDefUuid } = currentNodeDef
    if (!visitedNodeDefsByUuid[currentNodeDefUuid]) {
      if (NodeDefs.isEntity(currentNodeDef) && NodeDefs.isEnumerate(currentNodeDef)) {
        result.push(currentNodeDef)
      }
      const dependencyTypes = [SurveyDependencyType.applicable, SurveyDependencyType.defaultValues]
      const dependents = dependencyTypes.reduce((acc: NodeDef<any>[], dependencyType) => {
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
