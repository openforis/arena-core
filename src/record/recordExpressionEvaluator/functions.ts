import { ExpressionFunctions } from '../../expression'
import { Point, Points } from '../../geo'
import { Nodes, NodeValues } from '../../node'
import { nodeDefExpressionFunctions } from '../../nodeDefExpressionEvaluator/functions'
import { Surveys } from '../../survey'
import { Arrays } from '../../utils'
import { Records } from '../records'
import { RecordExpressionContext } from './context'

export const recordExpressionFunctions: ExpressionFunctions<RecordExpressionContext> = {
  ...nodeDefExpressionFunctions,
  count: {
    minArity: 1,
    evaluateArgsToNodes: true,
    executor: (_context: RecordExpressionContext) => async (nodeSet) => {
      if (!nodeSet) return 0
      if (Array.isArray(nodeSet)) return nodeSet.length
      return 0
    },
  },
  first: {
    minArity: 1,
    maxArity: 1,
    evaluateArgsToNodes: false,
    executor: (_context: RecordExpressionContext) => async (nodeSet) => {
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
      (context: RecordExpressionContext) =>
      async (...nodeSetOrPoints): Promise<object | null> => {
        if (nodeSetOrPoints.length === 0) return null

        const { survey } = context
        const srsIndex = Surveys.getSRSIndex(survey)

        const toPoint = (nodeOrPoint: any): Point | null => {
          if (typeof nodeOrPoint === 'string') {
            const point = Points.parse(nodeOrPoint)
            return point && Points.isValid(point, srsIndex) ? point : null
          }
          return Points.isValid(nodeOrPoint, srsIndex)
            ? nodeOrPoint
            : NodeValues.getValueAsPoint({ survey, node: nodeOrPoint })
        }

        const pointsLatLon: Point[] = nodeSetOrPoints.reduce((acc, nodeSetOrPoint) => {
          for (const nodeOrPoint of Arrays.toArray(nodeSetOrPoint)) {
            const point = toPoint(nodeOrPoint)
            const pointLatLon = point ? Points.toLatLong(point, srsIndex) : null
            if (pointLatLon) {
              acc.push(pointLatLon)
            }
          }
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
    executor: (context: RecordExpressionContext) => async (node) => {
      if (!node) {
        return -1
      }
      if (Nodes.isRoot(node)) {
        return 0
      }
      const { record } = context
      const parentNode = Records.getParent(node)(record)
      if (!parentNode) {
        return -1
      }
      const children = Records.getChildren(parentNode, node.nodeDefUuid)(record)
      return children.findIndex((n) => Nodes.areEqual(n, node))
    },
  },
  last: {
    minArity: 1,
    maxArity: 1,
    evaluateArgsToNodes: false,
    executor: (_context: RecordExpressionContext) => async (nodeSet) => {
      if (nodeSet && Array.isArray(nodeSet) && nodeSet.length > 0) {
        return nodeSet[nodeSet.length - 1]
      }
      return null
    },
  },
  parent: {
    minArity: 1,
    maxArity: 1,
    evaluateArgsToNodes: true,
    evaluateToNode: true,
    executor: (context: RecordExpressionContext) => async (node) => {
      if (!node || Nodes.isRoot(node)) {
        return null
      }
      const { record } = context
      return Records.getParent(node)(record)
    },
  },
  recordCycle: {
    minArity: 0,
    maxArity: 0,
    executor: (context: RecordExpressionContext) => async () => Number(context.record.cycle ?? 0) + 1,
  },
  recordDateCreated: {
    minArity: 0,
    maxArity: 0,
    executor: (context: RecordExpressionContext) => async () => context.record.dateCreated,
  },
  recordDateLastModified: {
    minArity: 0,
    maxArity: 0,
    executor: (context: RecordExpressionContext) => async () => context.record.dateModified,
  },
  recordOwnerEmail: {
    minArity: 0,
    maxArity: 0,
    executor: (context: RecordExpressionContext) => async () => context.record.ownerEmail,
  },
  recordOwnerName: {
    minArity: 0,
    maxArity: 0,
    executor: (context: RecordExpressionContext) => async () => context.record.ownerName,
  },
  recordOwnerRole: {
    minArity: 0,
    maxArity: 0,
    executor: (context: RecordExpressionContext) => async () => context.record.ownerRole,
  },
  sum: {
    minArity: 1,
    maxArity: 1,
    evaluateArgsToNodes: false,
    executor: (_context: RecordExpressionContext) => async (nodeSet) => {
      if (!nodeSet) return 0
      if (Array.isArray(nodeSet)) return nodeSet.reduce((acc, value) => acc + (Number(value) || 0), 0)
      return 0
    },
  },
  userIsRecordOwner: {
    minArity: 0,
    maxArity: 0,
    executor: (context: RecordExpressionContext) => async () => context.user?.uuid === context.record?.ownerUuid,
  },
}
