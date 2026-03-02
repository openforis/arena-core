import { User } from '../../auth'
import { Nodes } from '../../node'
import { NodeDefCountType } from '../../nodeDef'
import { NodeDefExpressionFactory } from '../../nodeDef/nodeDef'
import { Surveys } from '../../survey'
import { RecordBuilder, RecordNodeBuilders } from '../../tests/builder/recordBuilder'
import { SurveyBuilder, SurveyObjectBuilders } from '../../tests/builder/surveyBuilder'
import { createTestAdminUser } from '../../tests/data'
import { TestUtils } from '../../tests/testUtils'
import { Record } from '../record'
import { Records } from '../records'
import * as RecordNodesUpdater from './recordNodesUpdater'

const { entityDef, integerDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

let user: User

describe('Record nodes updater - dependents count updater', () => {
  beforeAll(async () => {
    user = createTestAdminUser()
  }, 10000)

  test('Min count update', async () => {
    const survey = await new SurveyBuilder(
      user,
      entityDef(
        'root_entity',
        integerDef('identifier').key(),
        integerDef('source_attribute'),
        integerDef('dependent_attribute')
          .multiple()
          .minCount([NodeDefExpressionFactory.createInstance({ expression: 'source_attribute + 2' })])
      )
    ).build()

    const dependentAttributeDef = Surveys.getNodeDefByName({ survey, name: 'dependent_attribute' })

    let record = new RecordBuilder(
      user,
      survey,
      entity(
        'root_entity',
        attribute('identifier', 10),
        attribute('source_attribute', 1),
        attribute('dependent_attribute', [22, 23, 24])
      )
    ).build()

    const rootNode = Records.getRoot(record)
    if (!rootNode) throw new Error('root node undefined')

    const updateSourceAndExpectDependentCount = async (params: {
      sourceValue: any
      countType: NodeDefCountType
      expectedCount: number
    }): Promise<Record> => {
      const { sourceValue, expectedCount, countType } = params
      const nodeToUpdate = TestUtils.getNodeByPath({ survey, record, path: 'root_entity.source_attribute' })
      const nodeUpdated = { ...nodeToUpdate, value: sourceValue }
      record = Records.addNode(nodeUpdated)(record)

      const updateResult = await RecordNodesUpdater.updateNodesDependents({
        user,
        survey,
        record,
        nodes: { [nodeToUpdate.iId]: nodeUpdated },
      })

      expect(updateResult).not.toBeNull()
      record = updateResult.record

      const rootNode = Records.getRoot(record)
      if (!rootNode) throw new Error('root node undefined')

      const count = Nodes.getChildrenMinOrMaxCount({
        parentNode: rootNode,
        nodeDef: dependentAttributeDef,
        countType,
      })

      expect(count).toBe(expectedCount)
      return record
    }

    record = await updateSourceAndExpectDependentCount({
      sourceValue: 10,
      countType: NodeDefCountType.min,
      expectedCount: 12,
    })

    record = await updateSourceAndExpectDependentCount({
      sourceValue: 30,
      countType: NodeDefCountType.min,
      expectedCount: 32,
    })
  })
})
