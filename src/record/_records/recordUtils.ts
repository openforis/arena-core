import { CategoryItem } from '../../category'
import { ArenaRecordNode, NodeValues } from '../../node'
import { NodeDef, NodeDefCode, NodeDefEntity, NodeDefs, NodeDefType } from '../../nodeDef'
import { CategoryItemProvider } from '../../nodeDefExpressionEvaluator/categoryItemProvider'
import { Survey, Surveys } from '../../survey'
import { ArenaRecord } from '../record'
import {
  getChildren,
  getDescendantsOrSelf,
  getParent,
  getParentCodeAttribute,
  getRoot,
  isNodeFilledByUser,
} from './recordGetters'

const findDependentEnumeratedEntityDefs = (params: { survey: Survey; nodeDef: NodeDef<any> }): NodeDefEntity[] => {
  const { survey, nodeDef } = params
  const dependentEnumeratedEntityDefs =
    NodeDefs.getType(nodeDef) === NodeDefType.code
      ? Surveys.getDependentEnumeratedEntityDefs({ survey, nodeDef: nodeDef as NodeDefCode })
      : []

  const applicableDependentEnumeratedEntityDefs = Surveys.findApplicableDependentEnumeratedEntityDefs(nodeDef)(survey)
  dependentEnumeratedEntityDefs.push(...applicableDependentEnumeratedEntityDefs)

  return dependentEnumeratedEntityDefs
}

const hasNodeNonEmptyDescendants = (params: {
  record: ArenaRecord
  parentNode: ArenaRecordNode | undefined
  nodeDefDescendant: NodeDefEntity
}): boolean => {
  const { record, parentNode, nodeDefDescendant } = params
  const descendants = getDescendantsOrSelf({ node: parentNode ?? getRoot(record)!, nodeDefDescendant })(record)
  const nonEmptyDescendants = descendants.filter((dependentEntity) =>
    getChildren(dependentEntity)(record).some((childNode) => isNodeFilledByUser(childNode)(record))
  )
  return nonEmptyDescendants.length > 0
}

export const findDependentEnumeratedEntityDefsNotEmpty =
  (params: { survey: Survey; node: ArenaRecordNode; nodeDef: NodeDef<any> }) => (record: ArenaRecord) => {
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
    survey: Survey
    enumeratorDef: NodeDefCode
    parentNode: ArenaRecordNode
    categoryItemProvider?: CategoryItemProvider
    allowedCodes?: Set<string>
  }) =>
  async (record: ArenaRecord): Promise<CategoryItem[]> => {
    const { survey, enumeratorDef, parentNode, categoryItemProvider, allowedCodes } = params
    const categoryUuid = NodeDefs.getCategoryUuid(enumeratorDef)
    if (!categoryUuid) return []
    const category = Surveys.getCategoryByUuid({ survey, categoryUuid })
    if (!category) return []

    let parentItemUuid
    const parentCodeDefUuid = NodeDefs.getParentCodeDefUuid(enumeratorDef)
    if (parentCodeDefUuid) {
      const parentCodeAttribute = getParentCodeAttribute({ parentNode, nodeDef: enumeratorDef })(record)
      parentItemUuid = parentCodeAttribute ? NodeValues.getItemUuid(parentCodeAttribute) : null
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
