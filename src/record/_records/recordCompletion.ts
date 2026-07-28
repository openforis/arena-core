import { Node, Nodes } from '../../node'
import { NodeDef, NodeDefProps, NodeDefs, NodeDefType } from '../../nodeDef'
import { Survey, Surveys } from '../../survey'
import { Numbers } from '../../utils'
import { Record } from '../record'
import { getChildren, getRoot } from './recordGetters'

export interface EntityCompletionStats {
  total: number
  filled: number
}

const emptyStats = (): EntityCompletionStats => ({ total: 0, filled: 0 })

const addStats = (statsAcc: EntityCompletionStats, statsToAdd: EntityCompletionStats): void => {
  statsAcc.total += statsToAdd.total
  statsAcc.filled += statsToAdd.filled
}

const getAttributeCompletionStats = (params: {
  record: Record
  entity: Node
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
}): EntityCompletionStats => {
  const { record, entity, nodeDef } = params

  if (NodeDefs.isMultiple(nodeDef)) {
    const minCount = Nodes.getChildrenMinCount({ parentNode: entity, nodeDef })
    if (Number.isNaN(minCount) || minCount <= 0) return emptyStats()

    const filledNodesCount = getChildren(entity, nodeDef.uuid)(record).filter(Nodes.isValueNotBlank).length

    return { total: minCount, filled: Math.min(filledNodesCount, minCount) }
  }

  if (!NodeDefs.isRequired(nodeDef) && !NodeDefs.isKey(nodeDef)) return emptyStats()

  const node = getChildren(entity, nodeDef.uuid)(record)[0]
  return { total: 1, filled: node && Nodes.isValueNotBlank(node) ? 1 : 0 }
}

const getChildEntityCompletionStats = (params: {
  survey: Survey
  record: Record
  parentEntity: Node
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
}): EntityCompletionStats => {
  const { survey, record, parentEntity, nodeDef } = params
  const childEntities = getChildren(parentEntity, nodeDef.uuid)(record)

  if (NodeDefs.isSingle(nodeDef)) {
    const childEntity = childEntities[0]
    return childEntity ? getEntityCompletionStats({ survey, record, entity: childEntity }) : emptyStats()
  }

  const minCount = Nodes.getChildrenMinCount({ parentNode: parentEntity, nodeDef })
  const expectedCount = Number.isNaN(minCount) ? 0 : Math.max(minCount, 0)
  if (expectedCount === 0) return emptyStats()

  const stats = emptyStats()
  for (let index = 0; index < expectedCount; index++) {
    const childEntity = childEntities[index]
    // a missing repetition (below the min count) counts as a single incomplete unit
    addStats(
      stats,
      childEntity ? getEntityCompletionStats({ survey, record, entity: childEntity }) : { total: 1, filled: 0 }
    )
  }
  return stats
}

const getEntityCompletionStats = (params: { survey: Survey; record: Record; entity: Node }): EntityCompletionStats => {
  const { survey, record, entity } = params
  const entityDef = Surveys.getNodeDefByUuid({ survey, uuid: entity.nodeDefUuid })
  const childDefs = Surveys.getNodeDefChildren({ survey, nodeDef: entityDef })

  const stats = emptyStats()
  for (const childDef of childDefs) {
    if (!Nodes.isChildApplicable(entity, childDef.uuid)) continue

    const childStats = NodeDefs.isEntity(childDef)
      ? getChildEntityCompletionStats({ survey, record, parentEntity: entity, nodeDef: childDef })
      : getAttributeCompletionStats({ record, entity, nodeDef: childDef })

    addStats(stats, childStats)
  }
  return stats
}

const toCompletionPercent = (stats: EntityCompletionStats): number => {
  const { total, filled } = stats
  if (total <= 0) return 100
  return Numbers.roundToPrecision((filled / total) * 100, 2)
}

/**
 * Returns the percentage of completion of the given entity (0-100), considering every descendant recursively.
 * A required or key attribute is considered filled when it has a non empty value; multiple attributes and
 * entities are considered filled based on their min count (see Nodes.getChildrenMinCount).
 */
export const getEntityCompletionPercent = (params: { survey: Survey; record: Record; entity: Node }): number =>
  toCompletionPercent(getEntityCompletionStats(params))

/**
 * Returns the percentage of completion of the given record (0-100), i.e. the completion of its root entity.
 */
export const getRecordCompletionPercent = (params: { survey: Survey; record: Record }): number => {
  const { survey, record } = params
  const rootEntity = getRoot(record)
  return rootEntity ? getEntityCompletionPercent({ survey, record, entity: rootEntity }) : 0
}
