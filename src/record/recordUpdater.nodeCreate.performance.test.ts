import { describe, test, expect, beforeAll } from '@jest/globals'

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
  const startAll = performance.now()

  for (let index = 0; index < totalNodes; index++) {
    const start = performance.now()
    const { record: recordUpdated } = await RecordUpdater.createNodeAndDescendants({
      user,
      survey,
      record,
      nodeDef: multEntityDef,
      parentNode: rootEntity,
    })
    record = recordUpdated
    const end = performance.now()
    const elapsedTime = end - start
    if (index === 0) {
      nodeCreationTime = elapsedTime
    }
  }
  const endAll = performance.now()
  return { totalTime: endAll - startAll, nodeCreationTime }
}

describe('RecordUpdater - node create - performance test', () => {
  beforeAll(async () => {
    user = createTestAdminUser()
  }, 10000)

  test('Multiple entity', async () => {
    survey = await new SurveyBuilder(
      user,
      entityDef(
        'root_entity',
        integerDef('root_id').key(),
        entityDef('mult_entity', integerDef('mult_entity_id').key())
      )
    ).build()

    record = RecordFactory.createInstance({ surveyUuid: survey.uuid, user })

    const updateResult = await RecordUpdater.createRootEntity({ user, survey, record })
    record = updateResult.record

    const nodeDefName = 'mult_entity'
    const totalNodes = 500
    const multEntityDef = Surveys.getNodeDefByName({ survey, name: nodeDefName })
    const keyDef = Surveys.getNodeDefByName({ survey, name: 'mult_entity_id' })
    const entitiesCountBefore = Records.getNodesByDefUuid(multEntityDef.uuid)(record).length

    await createNodes({ nodeDefName, totalNodes })

    // NOTE: no assertion on the creation time here: it used to assert that creating the last entity is slower
    // than creating the first one (wall-clock ratio), which fails randomly once node creation is fast enough
    const expectedCount = entitiesCountBefore + totalNodes
    expect(Records.getNodesByDefUuid(multEntityDef.uuid)(record)).toHaveLength(expectedCount)
    expect(Records.getNodesByDefUuid(keyDef.uuid)(record)).toHaveLength(expectedCount)
  })

  test('Multiple entity with autoincrement', async () => {
    survey = await new SurveyBuilder(
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
    expect(totalTime).toBeLessThan(totalNodes * (nodeCreationTime + 4))
  })
})
