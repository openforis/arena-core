import { describe, test, expect, beforeAll, jest } from '@jest/globals'

import { SurveyBuilder, SurveyObjectBuilders } from '../../tests/builder/surveyBuilder'
import { RecordBuilder, RecordNodeBuilders } from '../../tests/builder/recordBuilder'
import { createTestAdminUser } from '../../tests/data'
import { TestUtils } from '../../tests/testUtils'
import { User } from '../../auth'
import { NodeValues } from '../../node'
import { Survey } from '../../survey'
import { Validations } from '../../validation'
import { ArenaRecord } from '../record'
import { RecordUpdater } from '../recordUpdater'
import { Records } from '../records'
import { RecordValidator } from './index'

const { entityDef, integerDef, textDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

let user: User
let survey: Survey

const isKeyValid = (params: { record: ArenaRecord; path: string }): boolean => {
  const { record, path } = params
  const keyNode = TestUtils.getNodeByPath({ survey, record, path })
  const validation = Validations.getValidation(record)
  return Validations.getFieldValidation(keyNode.uuid)(validation).valid
}

const buildRecord = (tableIds: number[]): ArenaRecord =>
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

  test('entities with empty keys are not duplicates', async () => {
    const record = buildRecord([1, 2])
    const keyNodes = ['table[0].table_id', 'table[1].table_id'].map((path) =>
      TestUtils.getNodeByPath({ survey, record, path })
    )
    const recordWithEmptyKeys = Records.addNodes({
      [keyNodes[0].uuid]: { ...keyNodes[0], value: null },
      [keyNodes[1].uuid]: { ...keyNodes[1], value: null },
    })(record)

    const validation = await RecordValidator.validateRecord({ user, survey, record: recordWithEmptyKeys })

    for (const keyNode of keyNodes) {
      const valueValidation = Validations.getFieldValidation('value')(
        Validations.getFieldValidation(keyNode.uuid)(validation)
      )
      const errorKeys = Validations.getErrors(valueValidation).map((error) => error.key)
      expect(errorKeys).toContain('record.attribute.valueRequired')
      expect(errorKeys).not.toContain('record.entity.keyDuplicate')
    }
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

  test('validating many key attributes at once does not compare every key with all the sibling keys', async () => {
    const tablesCount = 200
    const record = buildRecord(Array.from({ length: tablesCount }, (_t, index) => (index % 100) + 1))
    const isValueEqualSpy = jest.spyOn(NodeValues, 'isValueEqual')
    try {
      const validation = await RecordValidator.validateRecord({ user, survey, record })
      const recordValidated = { ...record, validation }
      expect(isKeyValid({ record: recordValidated, path: 'table[0].table_id' })).toBeFalsy()
      expect(isKeyValid({ record: recordValidated, path: 'table[100].table_id' })).toBeFalsy()
      // sibling key nodes to re-validate (comparisons with parentNode, the duplicate check itself doesn't pass it):
      // keys already being validated are not compared with every sibling key (quadratic)
      const siblingKeysComparisons = isValueEqualSpy.mock.calls.filter(([params]) => !!params.parentNode)
      expect(siblingKeysComparisons.length).toBeLessThanOrEqual(tablesCount)
    } finally {
      isValueEqualSpy.mockRestore()
    }
  })

  test('checking duplicate entities does not compare the keys of every entity with the ones of all the siblings', async () => {
    const tablesCount = 200
    // unique keys except table[0] and table[199]
    const record = buildRecord(
      Array.from({ length: tablesCount }, (_t, index) => (index === tablesCount - 1 ? 1 : index + 1))
    )
    const isValueEqualSpy = jest.spyOn(NodeValues, 'isValueEqual')
    try {
      const validation = await RecordValidator.validateRecord({ user, survey, record })
      const recordValidated = { ...record, validation }
      expect(isKeyValid({ record: recordValidated, path: 'table[0].table_id' })).toBeFalsy()
      expect(isKeyValid({ record: recordValidated, path: `table[${tablesCount - 1}].table_id` })).toBeFalsy()
      expect(isKeyValid({ record: recordValidated, path: 'table[1].table_id' })).toBeTruthy()
      // duplicate check comparisons (without parentNode): 39800 when comparing every entity with all its siblings
      const duplicateCheckComparisons = isValueEqualSpy.mock.calls.filter(([params]) => !params.parentNode)
      expect(duplicateCheckComparisons.length).toBeLessThanOrEqual(tablesCount)
    } finally {
      isValueEqualSpy.mockRestore()
    }
  })
})

describe('AttributeKeyValidator - duplicate entity composite keys', () => {
  let compositeKeySurvey: Survey

  beforeAll(async () => {
    user = createTestAdminUser()
    compositeKeySurvey = await new SurveyBuilder(
      user,
      entityDef(
        'root_entity',
        integerDef('identifier').key(),
        entityDef('tree', integerDef('tree_id').key(), textDef('stem').key()).multiple()
      )
    ).build()
  }, 10000)

  test('entities are duplicate only if all the key values are equal', async () => {
    // tree_id and stem of every tree; duplicates: tree[1] and tree[48] (1, 'b'), tree[2] and tree[49] ('1' vs 1, 'c')
    const treeKeys: [any, any][] = Array.from({ length: 50 }, (_t, index) => [index + 10, 'a'])
    treeKeys[0] = [1, 'a']
    treeKeys[1] = [1, 'b']
    treeKeys[2] = [1, 'c']
    treeKeys[3] = [2, 'b']
    treeKeys[47] = [1, null]
    treeKeys[48] = [1, 'b']
    treeKeys[49] = ['1', 'c']
    const record = new RecordBuilder(
      user,
      compositeKeySurvey,
      entity(
        'root_entity',
        attribute('identifier', 10),
        ...treeKeys.map(([treeId, stem]) => entity('tree', attribute('tree_id', treeId), attribute('stem', stem)))
      )
    ).build()
    const validation = await RecordValidator.validateRecord({ user, survey: compositeKeySurvey, record })
    const recordValidated = { ...record, validation }

    const duplicateTreeIndexes = treeKeys
      .map((_keys, index) => index)
      .filter((index) => {
        const keyNode = TestUtils.getNodeByPath({ survey: compositeKeySurvey, record, path: `tree[${index}].tree_id` })
        const valueValidation = Validations.getFieldValidation('value')(
          Validations.getFieldValidation(keyNode.uuid)(Validations.getValidation(recordValidated))
        )
        return Validations.getErrors(valueValidation).some((error) => error.key === 'record.entity.keyDuplicate')
      })
    expect(duplicateTreeIndexes).toEqual([1, 2, 48, 49])
  })
})
