import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { RecordBuilder, RecordNodeBuilders } from '../tests/builder/recordBuilder'

const { booleanDef, entityDef, integerDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

import { RecordUpdater } from './recordUpdater'
import { createTestAdminUser } from '../tests/data'
import { TestUtils } from '../tests/testUtils'
import { User } from '../auth'
import { Record } from './record'
import { Survey, Surveys } from '../survey'
import { Records } from './records'
import { NodeDef } from '../nodeDef'
import { Node } from '../node'

let user: User

const updateAttributeAndExpectDependentApplicability = async (params: {
  survey: Survey
  record: Record
  nodePath: string
  value: any
  dependentNodePath: string
  expectedDependentApplicability: boolean
}): Promise<Record> => {
  const {
    survey,
    record,
    nodePath,
    value,
    dependentNodePath = params.nodePath,
    expectedDependentApplicability,
  } = params
  const nodeToUpdate = TestUtils.getNodeByPath({ survey, record, path: nodePath })

  const updateResult = await RecordUpdater.updateAttributeValue({
    user,
    survey,
    record,
    attributeIId: nodeToUpdate.iId,
    value,
  })

  expect(updateResult).not.toBeNull()
  const { record: recordUpdated } = updateResult

  const dependentNode = TestUtils.getNodeByPath({ survey, record: recordUpdated, path: dependentNodePath })
  expect(dependentNode).not.toBeNull()

  const dependentApplicability = Records.isNodeApplicable({ record: recordUpdated, node: dependentNode })
  expect(dependentApplicability).toBe(expectedDependentApplicability)

  return recordUpdated
}

const addNodeAndExpectDependentApplicability = async (params: {
  survey: Survey
  record: Record
  parentNode: Node
  nodeDef: NodeDef<any>
  dependentNodePath: string
  expectedDependentApplicability: boolean
}): Promise<Record> => {
  const { survey, record, parentNode, nodeDef, dependentNodePath, expectedDependentApplicability } = params
  const updateResult = await RecordUpdater.createNodeAndDescendants({
    user,
    survey,
    record,
    parentNode,
    nodeDef,
  })

  expect(updateResult).not.toBeNull()
  const { record: recordUpdated } = updateResult

  const dependentNode = TestUtils.getNodeByPath({ survey, record: recordUpdated, path: dependentNodePath })
  expect(dependentNode).not.toBeNull()

  const dependentApplicability = Records.isNodeApplicable({ record: recordUpdated, node: dependentNode })
  expect(dependentApplicability).toBe(expectedDependentApplicability)

  return recordUpdated
}

describe('RecordUpdater - attribute update => update dependent applicability', () => {
  beforeAll(async () => {
    user = createTestAdminUser()
  }, 10000)

  test('Dependent Applicable', async () => {
    const survey = await new SurveyBuilder(
      user,
      entityDef(
        'root_entity',
        integerDef('identifier').key(),
        booleanDef('trigger'),
        entityDef('table', integerDef('table_id').key(), integerDef('applicable_if_trigger').applyIf(`trigger == true`))
      )
    ).build()

    let record = new RecordBuilder(
      user,
      survey,
      entity(
        'root_entity',
        attribute('identifier', 10),
        attribute('trigger', 'true'),
        entity('table', attribute('table_id', 1), attribute('applicable_if_trigger'))
      )
    ).build()

    record = await updateAttributeAndExpectDependentApplicability({
      survey,
      record,
      nodePath: 'root_entity.trigger',
      value: 'false',
      dependentNodePath: 'table[0].applicable_if_trigger',
      expectedDependentApplicability: false,
    })

    record = await updateAttributeAndExpectDependentApplicability({
      survey,
      record,
      nodePath: 'root_entity.trigger',
      value: 'true',
      dependentNodePath: 'table[0].applicable_if_trigger',
      expectedDependentApplicability: true,
    })

    expect(record).not.toBeNull()
  })

  test('Dependent Not Applicable by default', async () => {
    const survey = await new SurveyBuilder(
      user,
      entityDef(
        'root_entity',
        integerDef('identifier').key(),
        booleanDef('trigger').defaultValue('false'),
        entityDef('table', integerDef('table_id').key(), integerDef('applicable_if_trigger').applyIf(`trigger == true`))
      )
    ).build()

    let record = new RecordBuilder(
      user,
      survey,
      entity('root_entity', attribute('identifier', 10), attribute('trigger'))
    ).build()

    const rootEntity = Records.getRoot(record)
    expect(rootEntity).not.toBeNull()
    if (!rootEntity) throw new Error('missing root entity')

    record = await addNodeAndExpectDependentApplicability({
      survey,
      record,
      parentNode: rootEntity,
      nodeDef: Surveys.getNodeDefByName({ survey, name: 'table' }),
      dependentNodePath: 'table[0].applicable_if_trigger',
      expectedDependentApplicability: false,
    })

    record = await updateAttributeAndExpectDependentApplicability({
      survey,
      record,
      nodePath: 'root_entity.trigger',
      value: 'true',
      dependentNodePath: 'table[0].applicable_if_trigger',
      expectedDependentApplicability: true,
    })
  })
})
