import { describe, test, expect, beforeAll } from '@jest/globals'

import { SurveyBuilder, SurveyObjectBuilders } from '../../tests/builder/surveyBuilder'
import { RecordBuilder, RecordNodeBuilders } from '../../tests/builder/recordBuilder'
import { createTestAdminUser } from '../../tests/data'
import { TestUtils } from '../../tests/testUtils'
import { User } from '../../auth'
import { Survey } from '../../survey'
import { Validations } from '../../validation'
import { Record } from '../record'
import { RecordUpdater } from '../recordUpdater'
import { RecordValidator } from './index'

const { entityDef, integerDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

let user: User
let survey: Survey

const isKeyValid = (params: { record: Record; path: string }): boolean => {
  const { record, path } = params
  const keyNode = TestUtils.getNodeByPath({ survey, record, path })
  const validation = Validations.getValidation(record)
  return Validations.getFieldValidation(keyNode.uuid)(validation).valid
}

const buildRecord = (tableIds: number[]): Record =>
  new RecordBuilder(
    user,
    survey,
    entity(
      'root_entity',
      attribute('identifier', 10),
      ...tableIds.map((tableId) => entity('table', attribute('table_id', tableId)))
    )
  ).build()

describe('AttributeKeyValidator - duplicate entity keys', () => {
  beforeAll(async () => {
    user = createTestAdminUser()
    survey = await new SurveyBuilder(
      user,
      entityDef(
        'root_entity',
        integerDef('identifier').key(),
        entityDef('table', integerDef('table_id').key()).multiple()
      )
    ).build()
  }, 10000)

  test('updating a key attribute re-validates sibling keys with the same value or with errors', async () => {
    let record = buildRecord([1, 2, 3])

    const keyNode = TestUtils.getNodeByPath({ survey, record, path: 'table[0].table_id' })

    // table[0].table_id = 2 => duplicate of table[1]
    let updateResult = await RecordUpdater.updateAttributeValue({
      user,
      survey,
      record,
      attributeUuid: keyNode.uuid,
      value: 2,
    })
    record = updateResult.record
    expect(isKeyValid({ record, path: 'table[0].table_id' })).toBeFalsy()
    expect(isKeyValid({ record, path: 'table[1].table_id' })).toBeFalsy()

    // table[0].table_id = 1 => no more duplicates (sibling with errors re-validated)
    updateResult = await RecordUpdater.updateAttributeValue({
      user,
      survey,
      record,
      attributeUuid: keyNode.uuid,
      value: 1,
    })
    record = updateResult.record
    expect(isKeyValid({ record, path: 'table[0].table_id' })).toBeTruthy()
    expect(isKeyValid({ record, path: 'table[1].table_id' })).toBeTruthy()
  })

  test('validating many key attributes at once detects duplicates', async () => {
    const record = buildRecord([1, 2, 3, 2, 5])
    const validation = await RecordValidator.validateRecord({ user, survey, record })
    const recordValidated = { ...record, validation }

    expect(isKeyValid({ record: recordValidated, path: 'table[0].table_id' })).toBeTruthy()
    expect(isKeyValid({ record: recordValidated, path: 'table[1].table_id' })).toBeFalsy()
    expect(isKeyValid({ record: recordValidated, path: 'table[2].table_id' })).toBeTruthy()
    expect(isKeyValid({ record: recordValidated, path: 'table[3].table_id' })).toBeFalsy()
    expect(isKeyValid({ record: recordValidated, path: 'table[4].table_id' })).toBeTruthy()
  })
})
