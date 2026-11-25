import { beforeAll, describe, expect, test } from '@jest/globals'

import { ArenaAppInfo } from '../app'
import { ArenaUser } from '../auth'
import { ArenaSurvey, Surveys } from '../survey'
import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { createTestAdminUser } from '../tests/data'
import { TestUtils } from '../tests/testUtils'
import { RecordFactory } from './factory'
import { ArenaRecord } from './record'
import { RecordUpdater } from './recordUpdater'
import { Records } from './records'

const { entityDef, integerDef, textDef } = SurveyObjectBuilders

const appInfoMobile: ArenaAppInfo = { appId: 'am', version: '1.0.0', platform: 'android' }
const appInfoMobileUpdated: ArenaAppInfo = { ...appInfoMobile, version: '1.1.0' }
const appInfoWeb: ArenaAppInfo = { appId: 'arena', version: '2.0.0', platform: 'web' }

let user: ArenaUser
let survey: ArenaSurvey

const getValue = (record: ArenaRecord, name: string): any =>
  TestUtils.getNodeByPath({ survey, record, path: `root_entity.${name}` }).value

const createRecord = async (appInfo: ArenaAppInfo): Promise<ArenaRecord> => {
  const record = RecordFactory.createInstance({ surveyUuid: survey.uuid, user, appInfo })
  return (await RecordUpdater.createRootEntity({ user, survey, record, appInfo })).record
}

describe('RecordUpdater - app info dependents', () => {
  beforeAll(async () => {
    user = createTestAdminUser()
    survey = await new SurveyBuilder(
      user,
      entityDef(
        'root_entity',
        integerDef('identifier').key(),
        textDef('app_id').readOnly().defaultValue('appId()'),
        textDef('app_id_label').readOnly().defaultValue('appIdLabel()'),
        textDef('app_platform').readOnly().defaultValue('appPlatform()'),
        textDef('app_version_editable').defaultValue('appVersion()'),
        textDef('app_version_one_time').readOnly().defaultValue('appVersion()').defaultValueEvaluatedOnlyOneTime(),
        textDef('app_version_note'),
        textDef('app_id_identifier').readOnly().defaultValue('appId() + "-" + identifier'),
        textDef('not_app_info_dependent').readOnly().defaultValue('app_version_note')
      )
    ).build()
  }, 10000)

  test('app info dependents found in the survey (function calls only)', () => {
    const names = Surveys.getAppInfoDependents({ survey })
      .map((nodeDef) => nodeDef.props.name)
      .sort()
    expect(names).toEqual([
      'app_id',
      'app_id_identifier',
      'app_id_label',
      'app_platform',
      'app_version_editable',
      'app_version_one_time',
    ])
  })

  test('expressions evaluated when the record is created', async () => {
    const record = await createRecord(appInfoMobile)
    expect(getValue(record, 'app_id')).toBe('am')
    expect(getValue(record, 'app_id_label')).toBe('Arena Mobile')
    expect(getValue(record, 'app_platform')).toBe('android')
    expect(getValue(record, 'app_version_editable')).toBe('1.0.0')
    expect(getValue(record, 'app_version_one_time')).toBe('1.0.0')
    expect(record.info?.createdWith).toEqual(appInfoMobile)
    expect(Records.isAppInfoChanged(appInfoMobile)(record)).toBe(false)
  })

  test('same app: nothing updated', async () => {
    const record = await createRecord(appInfoMobile)
    const updateResult = await RecordUpdater.updateAppInfoDependents({ user, survey, record, appInfo: appInfoMobile })
    expect(updateResult.record).toBe(record)
    expect(Object.keys(updateResult.nodes)).toHaveLength(0)
  })

  test('no app info: nothing updated', async () => {
    const record = await createRecord(appInfoMobile)
    expect(Records.isAppInfoChanged(undefined)(record)).toBe(false)
    const updateResult = await RecordUpdater.updateAppInfoDependents({ user, survey, record })
    expect(updateResult.record).toBe(record)
  })

  test('record opened in another platform: expressions evaluated again', async () => {
    const record = await createRecord(appInfoMobile)
    expect(Records.isAppInfoChanged(appInfoWeb)(record)).toBe(true)

    const { record: recordUpdated } = await RecordUpdater.updateAppInfoDependents({
      user,
      survey,
      record,
      appInfo: appInfoWeb,
    })
    expect(getValue(recordUpdated, 'app_id')).toBe('arena')
    expect(getValue(recordUpdated, 'app_id_label')).toBe('Arena')
    expect(getValue(recordUpdated, 'app_platform')).toBe('web')
    // default value applied (not modified by the user): evaluated again
    expect(getValue(recordUpdated, 'app_version_editable')).toBe('2.0.0')
    // evaluated only one time: value of the record creation kept
    expect(getValue(recordUpdated, 'app_version_one_time')).toBe('1.0.0')

    expect(recordUpdated.info?.createdWith).toEqual(appInfoMobile)
    expect(recordUpdated.info?.modifiedWith).toEqual(appInfoWeb)
    expect(Records.getAppInfoLast(recordUpdated)).toEqual(appInfoWeb)
    expect(Records.isAppInfoChanged(appInfoWeb)(recordUpdated)).toBe(false)
    // the record passed is not modified
    expect(record.info?.modifiedWith).toBeUndefined()
    expect(getValue(record, 'app_id')).toBe('am')
  })

  test('record opened after an app update: values entered by the user kept', async () => {
    let record = await createRecord(appInfoMobile)
    const editableAttribute = TestUtils.getNodeByPath({ survey, record, path: 'root_entity.app_version_editable' })
    record = (
      await RecordUpdater.updateAttributeValue({
        user,
        survey,
        record,
        attributeUuid: editableAttribute.uuid,
        value: 'custom',
        appInfo: appInfoMobile,
      })
    ).record

    const { record: recordUpdated } = await RecordUpdater.updateAppInfoDependents({
      user,
      survey,
      record,
      appInfo: appInfoMobileUpdated,
    })
    expect(getValue(recordUpdated, 'app_version_editable')).toBe('custom')
    expect(getValue(recordUpdated, 'app_version_one_time')).toBe('1.0.0')
    expect(recordUpdated.info?.modifiedWith).toEqual(appInfoMobileUpdated)
  })

  test('record updated in another platform (without updateAppInfoDependents): expressions evaluated again', async () => {
    const record = await createRecord(appInfoMobile)
    const identifier = TestUtils.getNodeByPath({ survey, record, path: 'root_entity.identifier' })
    const { record: recordUpdated } = await RecordUpdater.updateAttributeValue({
      user,
      survey,
      record,
      attributeUuid: identifier.uuid,
      value: 1,
      appInfo: appInfoWeb,
    })
    expect(getValue(recordUpdated, 'identifier')).toBe(1)
    expect(getValue(recordUpdated, 'app_platform')).toBe('web')
    expect(recordUpdated.info?.modifiedWith).toEqual(appInfoWeb)
  })

  test('update without app info (e.g. server job): values kept', async () => {
    const record = await createRecord(appInfoMobile)
    const identifier = TestUtils.getNodeByPath({ survey, record, path: 'root_entity.identifier' })
    const { record: recordWithIdentifier } = await RecordUpdater.updateAttributeValue({
      user,
      survey,
      record,
      attributeUuid: identifier.uuid,
      value: 1,
      appInfo: appInfoMobile,
    })
    expect(getValue(recordWithIdentifier, 'app_id_identifier')).toBe('am-1')

    // app_id_identifier is a dependent of identifier, but it is not evaluated without app info
    const { record: recordUpdated } = await RecordUpdater.updateAttributeValue({
      user,
      survey,
      record: recordWithIdentifier,
      attributeUuid: identifier.uuid,
      value: 2,
    })
    expect(getValue(recordUpdated, 'identifier')).toBe(2)
    expect(getValue(recordUpdated, 'app_id_identifier')).toBe('am-1')
    expect(getValue(recordUpdated, 'app_id')).toBe('am')
  })

  test('record created without app info: expressions evaluated when opened in an app', async () => {
    const recordNew = RecordFactory.createInstance({ surveyUuid: survey.uuid, user })
    const record = (await RecordUpdater.createRootEntity({ user, survey, record: recordNew })).record
    // not evaluated without app info
    expect(getValue(record, 'app_id')).toBeFalsy()

    const { record: recordUpdated } = await RecordUpdater.updateAppInfoDependents({
      user,
      survey,
      record,
      appInfo: appInfoMobile,
    })
    expect(getValue(recordUpdated, 'app_id')).toBe('am')
    expect(recordUpdated.info?.modifiedWith).toEqual(appInfoMobile)
  })
})
