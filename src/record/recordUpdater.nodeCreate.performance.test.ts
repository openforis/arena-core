import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'

const { entityDef, integerDef } = SurveyObjectBuilders

import { createTestAdminUser } from '../tests/data'

import { User } from '../auth'
import { Survey, Surveys } from '../survey'
import { RecordFactory } from './factory'
import { Records } from './records'
import { RecordUpdater } from './recordUpdater'
import { Record } from './record'

let user: User
let record: Record
let survey: Survey

const createNodes = async (params: { nodeDefName: string; totalNodes: number }) => {
  const { nodeDefName, totalNodes } = params
  const multEntityDef = Surveys.getNodeDefByName({ survey, name: nodeDefName })
  const rootEntity = Records.getRoot(record)

  let nodeCreationTime = NaN
  let lastNodeCreationTime = NaN
  const startAll = Date.now()

  for (let index = 0; index < totalNodes; index++) {
    const start = Date.now()
    const { record: recordUpdated } = await RecordUpdater.createNodeAndDescendants({
      user,
      survey,
      record,
      nodeDef: multEntityDef,
      parentNode: rootEntity,
    })
    record = recordUpdated
    const end = Date.now()
    const elapsedTime = end - start
    if (index === 0) {
      nodeCreationTime = elapsedTime
    } else if (index === totalNodes - 1) {
      lastNodeCreationTime = elapsedTime
    }
  }
  const endAll = Date.now()
  return { totalTime: endAll - startAll, nodeCreationTime, lastNodeCreationTime }
}

describe('RecordUpdater - node create - performance test', () => {
  beforeAll(async () => {
    user = createTestAdminUser()
  }, 10000)

  test('Multiple entity', async () => {
    survey = new SurveyBuilder(
      user,
      entityDef(
        'root_entity',
        integerDef('root_id').key(),
        entityDef(
          'mult_entity',
          integerDef('mult_entity_id').key().defaultValue('index($context)  + 1').defaultValueEvaluatedOnlyOneTime()
        )
      )
    ).build()

    record = RecordFactory.createInstance({ surveyUuid: survey.uuid, user })

    const updateResult = await RecordUpdater.createRootEntity({ user, survey, record })
    record = updateResult.record

    const nodeDefName = 'mult_entity'
    const totalNodes = 100
    // const { nodeCreationTime, lastNodeCreationTime } =
    await createNodes({ nodeDefName, totalNodes })

    // without autoincremental key, total time will be exponential (depends on the total number of nodes created)
    // expect(lastNodeCreationTime).toBeGreaterThan(nodeCreationTime * ((totalNodes * totalNodes) / 3000))
  })

  test('Multiple entity with autoincrement', async () => {
    survey = new SurveyBuilder(
      user,
      entityDef(
        'root_entity',
        integerDef('root_id').key(),
        entityDef(
          'mult_entity',
          integerDef('mult_entity_id')
            .key()
            .autoIncrementalKey() // mark it as autoincremental key: sibling key nodes should not be validated when new entity is created
            .defaultValue('index($context)  + 1')
            .defaultValueEvaluatedOnlyOneTime()
        )
      )
    ).build()

    record = RecordFactory.createInstance({ surveyUuid: survey.uuid, user })

    const updateResult = await RecordUpdater.createRootEntity({ user, survey, record })
    record = updateResult.record

    const nodeDefName = 'mult_entity'
    const totalNodes = 100
    const { totalTime, nodeCreationTime } = await createNodes({ nodeDefName, totalNodes })

    // with autoincremental key, total creation time should be linear
    expect(totalTime).toBeLessThan(totalNodes * (nodeCreationTime + 3))
  })
})
