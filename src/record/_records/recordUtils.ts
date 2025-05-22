import { CategoryItem } from '../../category'
import { Node, NodeValues } from '../../node'
import { NodeDef, NodeDefCode, NodeDefEntity, NodeDefs, NodeDefType } from '../../nodeDef'
import { CategoryItemProvider } from '../../nodeDefExpressionEvaluator/categoryItemProvider'
import { Survey, Surveys } from '../../survey'
import { Record } from '../record'
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
  record: Record
  parentNode: Node | undefined
  nodeDefDescendant: NodeDefEntity
}): boolean => {
  const { record, parentNode, nodeDefDescendant } = params
  const descendants = getDescendantsOrSelf({
    record,
    node: parentNode ?? getRoot(record)!,
    nodeDefDescendant,
  })
  const nonEmptyDescendants = descendants.filter((dependentEntity) =>
    getChildren(dependentEntity)(record).some((childNode) => isNodeFilledByUser(childNode)(record))
  )
  return nonEmptyDescendants.length > 0
}

export const findDependentEnumeratedEntityDefsNotEmpty =
  (params: { survey: Survey; node: Node; nodeDef: NodeDef<any> }) => (record: Record) => {
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
    parentNode: Node
    categoryItemProvider?: CategoryItemProvider
  }) =>
  async (record: Record): Promise<CategoryItem[]> => {
    const { survey, enumeratorDef, parentNode, categoryItemProvider } = params
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
    const items = Surveys.getEnumeratingCategoryItems({ survey, enumerator: enumeratorDef, parentItemUuid })
    if (items.length > 0) return items
    if (!categoryItemProvider) return []
    return categoryItemProvider.getItems({ survey, categoryUuid, parentItemUuid, draft: !!record.preview })
  }
