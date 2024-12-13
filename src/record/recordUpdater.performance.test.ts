import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'

const { entityDef, integerDef } = SurveyObjectBuilders

import { createTestAdminUser } from '../tests/data'

import { User } from '../auth'
import { Surveys } from '../survey'
import { RecordFactory } from './factory'
import { Records } from './records'
import { RecordUpdater } from './recordUpdater'

let user: User

describe('RecordUpdater - performance test - node create', () => {
  beforeAll(async () => {
    user = createTestAdminUser()
  }, 10000)

  test('Root entity creation', async () => {
    const survey = new SurveyBuilder(
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

    let record = RecordFactory.createInstance({ surveyUuid: survey.uuid, user })

    const updateResult = await RecordUpdater.createRootEntity({ user, survey, record })
    record = updateResult.record

    const rootEntity = Records.getRoot(record)

    const start = Date.now()

    const multEntityDef = Surveys.getNodeDefByName({ survey, name: 'mult_entity' })
    for (let index = 0; index < 1000; index++) {
      await RecordUpdater.createNodeAndDescendants({
        user,
        survey,
        record,
        nodeDef: multEntityDef,
        parentNode: rootEntity,
      })
    }

    const end = Date.now()

    expect(end - start).toBeLessThan(300)
  })
})
