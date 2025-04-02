import { CategoryItem } from '../../category'
import { Node, NodeValues } from '../../node'
import { NodeDef, NodeDefCode, NodeDefs, NodeDefType } from '../../nodeDef'
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

export const findDependentEnumeratedEntityDefsNotEmpty =
  (params: { survey: Survey; node: Node; nodeDef: NodeDef<any> }) => (record: Record) => {
    const { survey, node, nodeDef } = params
    const dependentEnumeratedEntityDefs =
      NodeDefs.getType(nodeDef) === NodeDefType.code
        ? Surveys.getDependentEnumeratedEntityDefs({ survey, nodeDef: nodeDef as NodeDefCode })
        : []

    const applicableDependentEnumeratedEntityDefs = Surveys.findApplicableDependentEnumeratedEntityDefs(nodeDef)(survey)
    dependentEnumeratedEntityDefs.push(...applicableDependentEnumeratedEntityDefs)

    if (dependentEnumeratedEntityDefs.length === 0) return []

    const parentNode = getParent(node)(record)

    return dependentEnumeratedEntityDefs.filter((dependentEnumeratedEntityDef) => {
      const dependentEntities = getDescendantsOrSelf({
        record,
        node: parentNode ?? getRoot(record)!,
        nodeDefDescendant: dependentEnumeratedEntityDef,
      })
      const dependentEntitiesNotEmpty = dependentEntities.filter((dependentEntity) =>
        getChildren(dependentEntity)(record).some((childNode) => isNodeFilledByUser(childNode)(record))
      )
      return dependentEntitiesNotEmpty.length > 0
    })
  }

export const getEnumeratingCategoryItems =
  (params: { survey: Survey; enumeratorDef: NodeDefCode; parentNode: Node }) =>
  (record: Record): CategoryItem[] => {
    const { survey, enumeratorDef, parentNode } = params
    let parentItemUuid
    if (NodeDefs.getParentCodeDefUuid(enumeratorDef)) {
      const parentCodeAttribute = getParentCodeAttribute({ parentNode, nodeDef: enumeratorDef })(record)
      parentItemUuid = parentCodeAttribute ? NodeValues.getItemUuid(parentCodeAttribute) : null
      if (!parentItemUuid) return []
    }
    return Surveys.getEnumeratingCategoryItems({ survey, enumerator: enumeratorDef, parentItemUuid })
  }
