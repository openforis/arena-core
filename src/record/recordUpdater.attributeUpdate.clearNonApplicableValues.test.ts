import { describe, test, expect } from '@jest/globals'

import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { RecordBuilder, RecordNodeBuilders } from '../tests/builder/recordBuilder'
import { createTestAdminUser } from '../tests/data'
import { TestUtils } from '../tests/testUtils'

import { Nodes } from '../node'
import { Survey, Surveys } from '../survey'
import { Record } from './record'
import { RecordUpdater } from './recordUpdater'

const { entityDef, integerDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

const user = createTestAdminUser()

// all the attributes (and the multiple entity) are relevant only if source > 10
const createSurvey = (): Promise<Survey> =>
  new SurveyBuilder(
    user,
    entityDef(
      'root_entity',
      integerDef('identifier').key(),
      integerDef('source'),
      integerDef('with_default').defaultValue('5').applyIf('source > 10'),
      integerDef('calculated').readOnly().defaultValue('source * 2').applyIf('source > 10'),
      integerDef('user_entered').applyIf('source > 10'),
      entityDef('mult_entity', integerDef('mult_entity_attr').defaultValue('3')).multiple().applyIf('source > 10')
    )
  ).build()

const updateValue = async (params: {
  survey: Survey
  record: Record
  path: string
  value: any
  clearNonApplicableValues?: boolean
  sideEffect?: boolean
}) => {
  const { survey, record, path, value, clearNonApplicableValues = true, sideEffect = false } = params
  const node = TestUtils.getNodeByPath({ survey, record, path })
  return RecordUpdater.updateAttributeValue({
    user,
    survey,
    record,
    attributeUuid: node.uuid,
    value,
    clearNonApplicableValues,
    sideEffect,
  })
}

const getClearedDefNames = (survey: Survey, clearedDefUuids: Set<string>): string[] =>
  [...clearedDefUuids].map((uuid) => Surveys.getNodeDefByUuid({ survey, uuid }).props.name ?? '').sort()

const getValue = (survey: Survey, record: Record, path: string) =>
  TestUtils.getNodeByPath({ survey, record, path }).value

// creates a record where all the dependent attributes are applicable and the default values are applied
const createRecord = async (survey: Survey, { userEnteredValue = null as number | null } = {}): Promise<Record> => {
  let record = new RecordBuilder(
    user,
    survey,
    entity(
      'root_entity',
      attribute('identifier', 1),
      attribute('source', 1),
      attribute('with_default'),
      attribute('calculated'),
      attribute('user_entered'),
      entity('mult_entity', attribute('mult_entity_attr'))
    )
  ).build()
  // non-applicable first, then applicable: the default values get applied
  const clearNonApplicableValues = false
  record = (await updateValue({ survey, record, path: 'source', value: 5, clearNonApplicableValues })).record
  record = (await updateValue({ survey, record, path: 'source', value: 20, clearNonApplicableValues })).record
  if (userEnteredValue !== null) {
    record = (await updateValue({ survey, record, path: 'user_entered', value: userEnteredValue })).record
  }
  return record
}

describe('RecordUpdater: clear values of attributes becoming non-applicable', () => {
  test('values set by default value expressions are cleared but not reported as cleared', async () => {
    const survey = await createSurvey()
    const record = await createRecord(survey)
    expect(getValue(survey, record, 'with_default')).toBe(5)
    expect(Nodes.isDefaultValueApplied(TestUtils.getNodeByPath({ survey, record, path: 'with_default' }))).toBe(true)
    expect(getValue(survey, record, 'calculated')).toBe(40)
    expect(getValue(survey, record, 'mult_entity[0].mult_entity_attr')).toBe(3)

    const { record: recordUpdated, clearedDefUuids } = await updateValue({ survey, record, path: 'source', value: 5 })

    expect(getValue(survey, recordUpdated, 'with_default')).toBeNull()
    expect(getValue(survey, recordUpdated, 'calculated')).toBeNull()
    // the multiple entity contained only default values: it's deleted, without reporting it
    expect(TestUtils.findNodeByPath({ survey, record: recordUpdated, path: 'mult_entity[0]' })).toBeUndefined()
    expect(getClearedDefNames(survey, clearedDefUuids)).toEqual([])
  })

  test.each([false, true])(
    'values entered by the user are reported as cleared (sideEffect: %s)',
    async (sideEffect) => {
      const survey = await createSurvey()
      let record = await createRecord(survey, { userEnteredValue: 7 })
      record = (await updateValue({ survey, record, path: 'mult_entity[0].mult_entity_attr', value: 8 })).record

      const { record: recordUpdated, clearedDefUuids } = await updateValue({
        survey,
        record,
        path: 'source',
        value: 5,
        sideEffect,
      })

      expect(getValue(survey, recordUpdated, 'user_entered')).toBeNull()
      expect(getValue(survey, recordUpdated, 'with_default')).toBeNull()
      expect(TestUtils.findNodeByPath({ survey, record: recordUpdated, path: 'mult_entity[0]' })).toBeUndefined()
      expect(getClearedDefNames(survey, clearedDefUuids)).toEqual(['mult_entity', 'mult_entity_attr', 'user_entered'])
    }
  )

  test('default values are applied again when the attributes become applicable again', async () => {
    const survey = await createSurvey()
    let record = await createRecord(survey)
    record = (await updateValue({ survey, record, path: 'source', value: 5 })).record

    const { record: recordUpdated } = await updateValue({ survey, record, path: 'source', value: 30 })

    expect(getValue(survey, recordUpdated, 'with_default')).toBe(5)
    expect(getValue(survey, recordUpdated, 'calculated')).toBe(60)
  })
})
