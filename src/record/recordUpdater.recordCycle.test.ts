import { describe, test, expect } from '@jest/globals'

import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { createTestAdminUser } from '../tests/data'
import { Survey, Surveys } from '../survey'
import { Validations } from '../validation'
import { ArenaRecord } from './record'
import { RecordCloner } from './recordCloner'
import { RecordFactory } from './factory'
import { RecordUpdater } from './recordUpdater'
import { Records } from './records'

const { entityDef, integerDef } = SurveyObjectBuilders

const user = createTestAdminUser()

// "only_cycle_0" is a required attribute defined only in cycle 0
const createSurvey = async (): Promise<Survey> => {
  const survey = await new SurveyBuilder(
    user,
    entityDef('root_entity', integerDef('identifier').key(), integerDef('only_cycle_0').required())
  ).build()
  for (const nodeDef of Object.values(survey.nodeDefs!)) {
    nodeDef.props.cycles = nodeDef.props.name === 'only_cycle_0' ? ['0'] : ['0', '1']
  }
  return survey
}

const createRecord = async (survey: Survey, cycle: string): Promise<ArenaRecord> => {
  const record = RecordFactory.createInstance({ surveyUuid: survey.uuid, user, cycle })
  return (await RecordUpdater.createRootEntity({ user, survey, record })).record
}

const countOnlyCycle0Nodes = (survey: Survey, record: ArenaRecord): number => {
  const nodeDef = Surveys.getNodeDefByName({ survey, name: 'only_cycle_0' })
  return Records.getNodesByDefUuid(nodeDef.uuid)(record).length
}

describe('Record cycle: node defs not in the record cycle', () => {
  test('no nodes created; not considered in validation and completion', async () => {
    const survey = await createSurvey()
    const record = await createRecord(survey, '1')

    expect(countOnlyCycle0Nodes(survey, record)).toBe(0)

    const identifier = Records.getChildren(
      Records.getRoot(record)!,
      Surveys.getNodeDefByName({ survey, name: 'identifier' }).uuid
    )(record)[0]
    const { record: recordUpdated } = await RecordUpdater.updateAttributeValue({
      user,
      survey,
      record,
      attributeUuid: identifier.uuid,
      value: 1,
    })
    expect(Validations.isValid(Validations.getValidation(recordUpdated))).toBe(true)
    expect(Records.getRecordCompletionPercent({ survey, record: recordUpdated })).toBe(100)
  })

  test('cloned record: nodes of the node defs not in the target cycle removed', async () => {
    const survey = await createSurvey()
    const record = await createRecord(survey, '0')
    expect(countOnlyCycle0Nodes(survey, record)).toBe(1)

    const { record: recordCloned } = RecordCloner.cloneRecord({ survey, record, cycleTo: '1' })

    expect(countOnlyCycle0Nodes(survey, recordCloned)).toBe(0)
  })
})
