import { ArenaExpressionFunctions } from '../../expression'
import { ArenaPoint, Points } from '../../geo'
import { ArenaRecordNode, RecordNodes, RecordNodeValues } from '../../node'
import { nodeDefExpressionFunctions } from '../../nodeDefExpressionEvaluator/functions'
import { Surveys } from '../../survey'
import { Arrays } from '../../utils'
import { Records } from '../records'
import { ArenaRecordExpressionContext } from './context'

const extractPreviousCycleValues = ({
  node,
  context,
}: {
  node: ArenaRecordNode | null
  context: ArenaRecordExpressionContext
}): any[] | null => {
  const { record, prevCycleRecord, survey } = context
  if (!node || !prevCycleRecord) {
    return null
  }
  const currentRecordEntity = Records.getParent(node)(record)
  if (!currentRecordEntity) {
    return null
  }
  const { uuid: entityUuid } = currentRecordEntity
  const prevCycleEntity = Records.findEntityWithSameKeysInAnotherRecord(
    survey,
    Records.getCycle(record),
    entityUuid,
    prevCycleRecord
  )(record)
  if (!prevCycleEntity) {
    return null
  }
  return Records.getChildren(prevCycleEntity, node.nodeDefUuid)(prevCycleRecord).map((prevNode) => prevNode.value)
}

// a single node is expected: node sets (arrays) are not supported
const getSingleNode = (nodeOrNodeSet: unknown): ArenaRecordNode | null =>
  nodeOrNodeSet && !Array.isArray(nodeOrNodeSet) && typeof nodeOrNodeSet === 'object'
    ? (nodeOrNodeSet as ArenaRecordNode)
    : null

export const recordExpressionFunctions: ArenaExpressionFunctions<ArenaRecordExpressionContext> = {
  ...nodeDefExpressionFunctions,
  count: {
    minArity: 1,
    maxArity: 1,
    evaluateArgsToNodes: true,
    executor: (_context: ArenaRecordExpressionContext) => (nodeSet) => {
      if (!nodeSet) return 0
      if (Array.isArray(nodeSet)) return nodeSet.length
      return 0
    },
  },
  first: {
    minArity: 1,
    maxArity: 1,
    evaluateArgsToNodes: false,
    executor: (_context: ArenaRecordExpressionContext) => (nodeSet) => {
      if (nodeSet && Array.isArray(nodeSet) && nodeSet.length > 0) {
        return nodeSet[0]
      }
      return null
    },
  },
  geoPolygon: {
    minArity: 1,
    evaluateArgsToNodes: true,
    executor:
      (context: ArenaRecordExpressionContext) =>
      (...nodeSetOrPoints): object | null => {
        if (nodeSetOrPoints.length === 0) return null

        const { survey } = context
        const srsIndex = Surveys.getSRSIndex(survey)

        const toPoint = (nodeOrPoint: any): ArenaPoint | null => {
          if (typeof nodeOrPoint === 'string') {
            const point = Points.parse(nodeOrPoint)
            return point && Points.isValid(point, srsIndex) ? point : null
          }
          return Points.isValid(nodeOrPoint, srsIndex)
            ? nodeOrPoint
            : RecordNodeValues.getValueAsPoint({ survey, node: nodeOrPoint })
        }

        const pointsLatLon: ArenaPoint[] = nodeSetOrPoints.reduce((acc, nodeSetOrPoint) => {
          Arrays.toArray(nodeSetOrPoint).forEach((nodeOrPoint) => {
            const point = toPoint(nodeOrPoint)
            const pointLatLon = point ? Points.toLatLong(point, srsIndex) : null
            if (pointLatLon) {
              acc.push(pointLatLon)
            }
          })
          return acc
        }, [])

        if (pointsLatLon.length === 0) return null

        return {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [pointsLatLon.map((point) => [point.x, point.y])],
          },
        }
      },
  },
  index: {
    minArity: 1,
    maxArity: 1,
    evaluateArgsToNodes: true,
    executor: (context: ArenaRecordExpressionContext) => (node) => {
      if (!node) {
        return -1
      }
      if (RecordNodes.isRoot(node)) {
        return 0
      }
      const { record } = context
      const parentNode = Records.getParent(node)(record)
      if (!parentNode) {
        return -1
      }
      const children = Records.getChildren(parentNode, node.nodeDefUuid)(record)
      return children.findIndex((n) => RecordNodes.areEqual(n, node))
    },
  },
  last: {
    minArity: 1,
    maxArity: 1,
    evaluateArgsToNodes: false,
    executor: (_context: ArenaRecordExpressionContext) => (nodeSet) => {
      if (nodeSet && Array.isArray(nodeSet) && nodeSet.length > 0) {
        return nodeSet.at(-1)
      }
      return null
    },
  },
  nodeDateCreated: {
    minArity: 1,
    maxArity: 1,
    evaluateArgsToNodes: true,
    executor: (_context: ArenaRecordExpressionContext) => (node) => getSingleNode(node)?.dateCreated ?? null,
  },
  nodeDateModified: {
    minArity: 1,
    maxArity: 1,
    evaluateArgsToNodes: true,
    executor: (_context: ArenaRecordExpressionContext) => (node) => getSingleNode(node)?.dateModified ?? null,
  },
  parent: {
    minArity: 1,
    maxArity: 1,
    evaluateArgsToNodes: true,
    evaluateToNode: true,
    executor: (context: ArenaRecordExpressionContext) => (node) => {
      if (!node || RecordNodes.isRoot(node)) {
        return null
      }
      const { record } = context
      return Records.getParent(node)(record)
    },
  },
  prevCycleValue: {
    minArity: 1,
    maxArity: 1,
    evaluateArgsToNodes: true,
    executor: (context: ArenaRecordExpressionContext) => (node) => extractPreviousCycleValues({ node, context })?.[0],
  },
  prevCycleValues: {
    minArity: 1,
    maxArity: 1,
    evaluateArgsToNodes: true,
    executor: (context: ArenaRecordExpressionContext) => (node) => extractPreviousCycleValues({ node, context }),
  },
  recordCycle: {
    minArity: 0,
    maxArity: 0,
    executor: (context: ArenaRecordExpressionContext) => () => Number(context.record.cycle ?? 0) + 1,
  },
  recordDateCreated: {
    minArity: 0,
    maxArity: 0,
    executor: (context: ArenaRecordExpressionContext) => () => context.record.dateCreated,
  },
  recordDateLastModified: {
    minArity: 0,
    maxArity: 0,
    executor: (context: ArenaRecordExpressionContext) => () => context.record.dateModified,
  },
  recordOwnerEmail: {
    minArity: 0,
    maxArity: 0,
    executor: (context: ArenaRecordExpressionContext) => () => context.record.ownerEmail,
  },
  recordOwnerName: {
    minArity: 0,
    maxArity: 0,
    executor: (context: ArenaRecordExpressionContext) => () => context.record.ownerName,
  },
  recordOwnerRole: {
    minArity: 0,
    maxArity: 0,
    executor: (context: ArenaRecordExpressionContext) => () => context.record.ownerRole,
  },
  sum: {
    minArity: 1,
    maxArity: 1,
    evaluateArgsToNodes: false,
    executor: (_context: ArenaRecordExpressionContext) => (nodeSet) => {
      if (!nodeSet) return 0
      if (Array.isArray(nodeSet)) return nodeSet.reduce((acc, value) => acc + (Number(value) || 0), 0)
      return 0
    },
  },
  unique: {
    minArity: 1,
    maxArity: 1,
    evaluateArgsToNodes: false,
    executor: (_context: ArenaRecordExpressionContext) => (nodeSet) => {
      if (!nodeSet || !Array.isArray(nodeSet)) return []
      return [...new Set(nodeSet.filter((value) => value !== null && value !== undefined && value !== ''))]
    },
  },
  userIsRecordOwner: {
    minArity: 0,
    maxArity: 0,
    executor: (context: ArenaRecordExpressionContext) => () => context.user?.uuid === context.record?.ownerUuid,
  },
}
