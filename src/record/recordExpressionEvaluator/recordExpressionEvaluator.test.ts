import { UserFactory } from '../../auth'
import { NodeDefType } from '../../nodeDef'
import { Survey, Surveys } from '../../survey'
import { Node } from '../../node'
import { Record } from '../record'
import { RecordExpressionEvaluator } from './recordExpressionEvaluator'
import { RecordExpressionContext } from './context'
import { Records } from '../records'
import { createTestRecord, createTestSurvey } from '../../tests/data'

type Query = {
  expression: string
  result?: any
  error?: boolean
  node?: string
}

let survey: Survey
let record: Record

const getNode = (path: string): Node => {
  let currentNode = Records.getRoot(record)
  path.split('.').forEach((pathPart, index) => {
    const partMatch = /(\w+)(\[(\d+)\])?/.exec(pathPart)
    if (!partMatch) throw new Error(`invalid syntax for path part: ${pathPart}`)

    const childName = partMatch[1]
    const childDef = Surveys.getNodeDefByName({ survey, name: childName })
    if (index === 0 && !childDef.parentUuid) {
      // skip root
    } else {
      const childIndex = Number(partMatch[3] || 0)
      const children = Records.getChildren({ record, parentNode: currentNode, childDefUuid: childDef.uuid })
      currentNode = children[childIndex]
    }
  })
  return currentNode
}

describe('RecordExpressionEvaluator', () => {
  beforeAll(async () => {
    const user = UserFactory.createInstance({ email: 'test@arena.org', name: 'test' })

    survey = createTestSurvey({ user })

    record = createTestRecord({ user, survey })
  }, 10000)
  const queries: Query[] = [
    { expression: 'cluster_id + 1', result: 13 },
    { expression: 'cluster_id != 1', result: true },
    // !12 == null under strict logical negation semantics
    { expression: '!cluster_id', result: null },
    // Number + String is invalid -> null
    { expression: 'cluster_id + "1"', result: null },
    { expression: '!(cluster_id == 1)', result: true },
    // 18 + 1
    { expression: 'cluster_distance + 1', result: 19 },
    // 18 + 1
    { expression: 'cluster_distance + 1', result: 19 },
    // 18 + 1 + 12
    { expression: 'cluster_distance + 1 + cluster_id', result: 31 },
    // 18 + 12
    { expression: 'cluster_distance + cluster_id', result: 30 },
    // 19 >= 12
    { expression: 'cluster_distance + 1 >= cluster_id', result: true },
    // 18 * 0.5 >= 12
    { expression: '(cluster_distance * 0.5) >= cluster_id', result: false },
    // 1728
    { expression: 'Math.pow(cluster_id, 3)', result: 1728 },
    // 18 * 0.5 >= 1728
    { expression: '(cluster_distance * 0.5) >= Math.pow(cluster_id, 3)', result: false },
    // visit_date must be before current date
    // { q: 'visit_date <= now()', r: true },
    // cluster_id is not empty
    { expression: 'isEmpty(cluster_id)', result: false },
    // gps_model is not empty
    { expression: 'isEmpty(gps_model)', result: false },
    // remarks is empty
    { expression: 'isEmpty(remarks)', result: true },
    // plot count is 3
    { expression: 'plot.length', result: 3 },
    // access multiple entities with index
    { expression: 'plot[0].plot_id', result: 1 },
    { expression: 'plot[1].plot_id', result: 2 },
    { expression: 'plot[2].plot_id', result: 3 },
    { expression: 'plot[4].plot_id', result: null },
    // plot_multiple_number counts
    { expression: 'plot[0].plot_multiple_number.length', result: 2 },
    { expression: 'plot[1].plot_multiple_number.length', result: 0 },
    { expression: 'plot[2].plot_multiple_number.length', result: 1 },
    // index (single entity)
    { expression: 'index(cluster)', result: 0 },
    { expression: 'index(cluster)', result: 0, node: 'cluster.plot[0].plot_id' },
    // index (multiple entity)
    { expression: 'index(plot)', result: 0, node: 'cluster.plot[0]' },
    { expression: 'index(plot)', result: 1, node: 'cluster.plot[1]' },
    { expression: 'index(plot)', result: 0, node: 'cluster.plot[0].plot_id' },
    { expression: 'index(plot)', result: 1, node: 'cluster.plot[1].plot_id' },
    { expression: 'index(plot[0])', result: 0 },
    { expression: 'index(plot[1])', result: 1 },
    { expression: 'index(plot[2])', result: 2 },
    { expression: 'index(plot[3])', result: -1 },
    // index (single attribute)
    { expression: 'index(visit_date)', result: 0, node: 'cluster.remarks' },
    { expression: 'index(plot[0].plot_id)', result: 0 },
    { expression: 'index(plot_id)', result: 0, node: 'cluster.plot[0].plot_multiple_number[1]' },
    // index (multiple attribute)
    { expression: 'index(plot[0].plot_multiple_number[0])', result: 0 },
    { expression: 'index(plot[0].plot_multiple_number[1])', result: 1 },
    { expression: 'index(plot[0].plot_multiple_number[2])', result: -1 },
    // parent
    { expression: 'parent(cluster)', result: null },
    { expression: 'parent(remarks)', result: () => getNode('cluster') },
    { expression: 'parent(plot_id)', result: () => getNode('cluster.plot[1]'), node: 'cluster.plot[1].plot_id' },
    { expression: 'parent(parent(plot_id))', result: () => getNode('cluster'), node: 'cluster.plot[1].plot_id' },
    { expression: 'index(parent(plot_id))', result: 1, node: 'cluster.plot[1].plot_id' },
    // access plot_id of previous plot
    {
      expression: 'parent(parent(plot_id)).plot[index(parent(plot_id)) - 1].plot_id',
      result: 1,
      node: 'cluster.plot[1].plot_id',
    },
    // access dbh of a tree inside sibling plot
    {
      expression: 'parent(parent(parent(dbh))).plot[index(parent(parent(dbh))) - 2].tree[1].dbh',
      result: 10.123,
      node: 'cluster.plot[2].tree[1].dbh',
    },
    // categoryItemProp
    { expression: `categoryItemProp('hierarchical_category', 'prop1', '1')`, result: 'Extra prop1 item 1' },
    { expression: `categoryItemProp('hierarchical_category', 'prop2', '3')`, result: 'Extra prop2 item 3' },
    { expression: `categoryItemProp('hierarchical_category', 'prop1', '2', '1')`, result: 'Extra prop1 item 2-1' },
    { expression: `categoryItemProp('hierarchical_category', 'prop1', cluster_id - 10)`, result: 'Extra prop1 item 2' },
    {
      expression: `categoryItemProp('hierarchical_category', 'prop1', cluster_id - 10, plot_id)`,
      result: 'Extra prop1 item 2-2',
      node: 'cluster.plot[1].plot_id',
    },
    // categoryItemProp: non existing prop or code
    {
      expression: `categoryItemProp('simple_category', 'prop9', '1')`,
      result: null,
    },
    {
      expression: `categoryItemProp('simple_category', 'prop1', '999')`,
      result: null,
    },
    // distance
    { expression: 'distance(plot[0].plot_location, plot[1].plot_location).toFixed(2)', result: '2171.94' },
    {
      expression:
        'distance(plot[0].plot_location, plot[1].plot_location) == distance(plot[1].plot_location, plot[0].plot_location)',
      result: true,
    },
    // distance (invalid node type)
    { expression: 'distance(plot[0].plot_location, remarks)', result: null },
    // distance (using categoryItemProp)
    {
      expression: `distance(cluster_location, categoryItemProp('sampling_point', 'location', cluster_id)).toFixed(2)`,
      result: '4307919.62',
    },
    {
      expression: `distance(plot_location, categoryItemProp('sampling_point', 'location', cluster_id, plot_id)).toFixed(2)`,
      result: '4311422.21',
      node: 'cluster.plot[1].plot_id',
    },
    // global objects (Array)
    { expression: 'Array.of(plot[0].plot_id, plot[1].plot_id, plot[2].plot_id)', result: [1, 2, 3] },
    // global objects (Date)
    { expression: `Date.parse('01 Jan 1970 00:00:00 GMT')`, result: 0 },
    { expression: 'Math.round(Date.now() / 1000)', result: () => Math.round(Date.now() / 1000) },
    // global objects (Math)
    { expression: 'Math.PI', result: Math.PI },
    { expression: 'Math.min(plot[0].plot_id, plot[1].plot_id, plot[2].plot_id)', result: 1 },
    { expression: 'Math.max(plot[0].plot_id, plot[1].plot_id, plot[2].plot_id)', result: 3 },
    // global objects (Number)
    { expression: 'Number.isFinite(plot[1].plot_id)', result: true },
    { expression: 'Number.isFinite(plot[1].plot_id / 0)', result: false },
    // global objects (String)
    { expression: 'String.fromCharCode(65, 66, 67)', result: 'ABC' },
    // global objects (unknown objects/functions)
    { expression: 'Invalid.func(1)', error: true },
    { expression: 'Math.unknownFunc(1)', error: true },
    // native properties (number)
    // { expression: 'Math.PI.toFixed(2)', result: '3.14' },
    // { expression: 'plot[0].tree[1].dbh.toFixed(1)', result: '10.1' },
    // { expression: 'plot[0].tree[1].dbh.toPrecision(4)', result: '10.12' },
    // // native properties (string)
    // { expression: 'gps_model.toLowerCase()', result: 'abc-123-xyz' },
    // { expression: 'gps_model.substring(4,7)', result: '123' },
    // { expression: 'gps_model.length', result: 11 },
    // global objects (constructors)
    { expression: 'Boolean(cluster_id)', result: true },
    { expression: 'Boolean(remarks)', result: false },
    { expression: 'Date.parse(Date()) <= Date.now()', result: true },
    { expression: 'Number(remarks)', result: 0 },
    { expression: 'String(cluster_id)', result: '12' },
    // // composite attribute members
    // { expression: 'cluster_location.x', result: 41.883012 },
    // { expression: 'cluster_location.y', result: 12.489056 },
    // { expression: 'cluster_location.srs', result: 'EPSG:4326' },
    // { expression: 'plot[0].tree[0].tree_species.code', result: 'ACA' },
    // { expression: 'plot[0].tree[0].tree_species.scientificName', result: 'Acacia sp.' },
    // { expression: 'visit_date.year', result: 2021 },
    // { expression: 'visit_date.month', result: 1 },
    // { expression: 'visit_date.day', result: 1 },
    // { expression: 'visit_date.week', error: true },
    // { expression: 'visit_time.hour', result: 10 },
    // { expression: 'visit_time.minute', result: 30 },
    // { expression: 'visit_time.seconds', error: true },
  ]

  queries.forEach((query: Query) => {
    const { expression, result, error: errorExpected = false, node } = query
    test(`${expression}${node ? ` (node: ${node})` : ''}`, () => {
      try {
        const nodeCurrent = node ? getNode(node) : Records.getRoot(record)
        const nodeCurrentDef = Surveys.getNodeDefByUuid({ survey, uuid: nodeCurrent.nodeDefUuid })
        const nodeContext =
          nodeCurrentDef.type === NodeDefType.entity ? nodeCurrent : Records.getParent({ record, node: nodeCurrent })
        if (!nodeContext) {
          throw new Error(`Cannot find context node: ${node}`)
        }
        const context: RecordExpressionContext = { survey, record, nodeContext, object: nodeContext }
        const res = new RecordExpressionEvaluator().evaluate(expression, context)
        expect(res).toEqual(result instanceof Function ? result() : result)
      } catch (error) {
        if (errorExpected) {
          expect(error).toBeDefined()
        } else {
          throw error
        }
      }
    })
  })
})
