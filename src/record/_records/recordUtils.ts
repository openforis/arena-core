import { ArenaCategoryItem } from '../../category'
import { ArenaRecordNode, RecordNodeValues } from '../../node'
import { ArenaNodeDef, ArenaNodeDefCode, ArenaNodeDefEntity, NodeDefs, NodeDefType } from '../../nodeDef'
import { ArenaCategoryItemProvider } from '../../nodeDefExpressionEvaluator/categoryItemProvider'
import { ArenaSurvey, Surveys } from '../../survey'
import { ArenaRecord } from '../record'
import {
  getChildren,
  getDescendantsOrSelf,
  getParent,
  getParentCodeAttribute,
  getRoot,
  isNodeFilledByUser,
} from './recordGetters'

const findDependentEnumeratedEntityDefs = (params: {
  survey: ArenaSurvey
  nodeDef: ArenaNodeDef<any>
}): ArenaNodeDefEntity[] => {
  const { survey, nodeDef } = params
  const dependentEnumeratedEntityDefs =
    NodeDefs.getType(nodeDef) === NodeDefType.code
      ? Surveys.getDependentEnumeratedEntityDefs({ survey, nodeDef: nodeDef as ArenaNodeDefCode })
      : []

  const applicableDependentEnumeratedEntityDefs = Surveys.findApplicableDependentEnumeratedEntityDefs(nodeDef)(survey)
  dependentEnumeratedEntityDefs.push(...applicableDependentEnumeratedEntityDefs)

  return dependentEnumeratedEntityDefs
}

const hasNodeNonEmptyDescendants = (params: {
  record: ArenaRecord
  parentNode: ArenaRecordNode | undefined
  nodeDefDescendant: ArenaNodeDefEntity
}): boolean => {
  const { record, parentNode, nodeDefDescendant } = params
  const descendants = getDescendantsOrSelf(parentNode ?? getRoot(record)!, nodeDefDescendant)(record)
  const nonEmptyDescendants = descendants.filter((dependentEntity) =>
    getChildren(dependentEntity)(record).some((childNode) => isNodeFilledByUser(childNode)(record))
  )
  return nonEmptyDescendants.length > 0
}

export const findDependentEnumeratedEntityDefsNotEmpty =
  (params: { survey: ArenaSurvey; node: ArenaRecordNode; nodeDef: ArenaNodeDef<any> }) => (record: ArenaRecord) => {
    const { survey, node, nodeDef } = params
    const dependentEnumeratedEntityDefs = findDependentEnumeratedEntityDefs({ survey, nodeDef })
    if (dependentEnumeratedEntityDefs.length === 0) return []

    const parentNode = getParent(node)(record)

    return dependentEnumeratedEntityDefs.filter((dependentEnumeratedEntityDef) =>
      hasNodeNonEmptyDescendants({ record, parentNode, nodeDefDescendant: dependentEnumeratedEntityDef })
    )
  }

export const getEnumeratingCategoryItems =
  (params: {
    survey: ArenaSurvey
    enumeratorDef: ArenaNodeDefCode
    parentNode: ArenaRecordNode
    categoryItemProvider?: ArenaCategoryItemProvider
    allowedCodes?: Set<string>
  }) =>
  async (record: ArenaRecord): Promise<ArenaCategoryItem[]> => {
    const { survey, enumeratorDef, parentNode, categoryItemProvider, allowedCodes } = params
    const categoryUuid = NodeDefs.getCategoryUuid(enumeratorDef)
    if (!categoryUuid) return []
    const category = Surveys.getCategoryByUuid({ survey, categoryUuid })
    if (!category) return []

    let parentItemUuid
    const parentCodeDefUuid = NodeDefs.getParentCodeDefUuid(enumeratorDef)
    if (parentCodeDefUuid) {
      const parentCodeAttribute = getParentCodeAttribute(parentNode, enumeratorDef)(record)
      parentItemUuid = parentCodeAttribute ? RecordNodeValues.getItemUuid(parentCodeAttribute) : null
      if (!parentItemUuid) return []
    }
    let items = Surveys.getEnumeratingCategoryItems({ survey, enumerator: enumeratorDef, parentItemUuid })
    if (items.length === 0 && categoryItemProvider) {
      items = await categoryItemProvider.getItems({ survey, categoryUuid, parentItemUuid, draft: !!record.preview })
    }
    if (allowedCodes) {
      items = items.filter((item) => item.props.code != null && allowedCodes.has(item.props.code))
    }
    return items
  }
