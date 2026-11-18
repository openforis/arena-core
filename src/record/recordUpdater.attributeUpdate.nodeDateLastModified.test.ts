import { beforeAll, describe, expect, test } from '@jest/globals'

import { User } from '../auth'
import { Survey, Surveys } from '../survey'
import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { createTestAdminUser } from '../tests/data'
import { TestUtils } from '../tests/testUtils'
import { ArenaRecord } from './record'
import { RecordFactory } from './factory'
import { RecordExpressionEvaluator } from './recordExpressionEvaluator'
import { RecordUpdater } from './recordUpdater'
import { Records } from './records'

const { entityDef, integerDef, textDef } = SurveyObjectBuilders

let user: User

const createSurvey = async (): Promise<Survey> =>
  new SurveyBuilder(
    user,
    entityDef(
      'root_entity',
      integerDef('identifier').key(),
      entityDef(
        'plot',
        integerDef('plot_id').key(),
        entityDef('tree', integerDef('tree_id').key(), integerDef('height')).multiple(),
        textDef('plot_update').readOnly().defaultValue('nodeDateLastModified(plot)')
      ).multiple(),
      textDef('record_update').readOnly().defaultValue('nodeDateLastModified(plot)')
    )
  ).build()

const getNode = (survey: Survey, record: ArenaRecord, path: string) => TestUtils.getNodeByPath({ survey, record, path })

const getValue = (survey: Survey, record: ArenaRecord, path: string) => getNode(survey, record, path).value

const createRecord = async (survey: Survey): Promise<ArenaRecord> => {
  const record = RecordFactory.createInstance({ surveyUuid: survey.uuid, user })
  return (await RecordUpdater.createRootEntity({ user, survey, record })).record
}

const addEntity = async (survey: Survey, record: ArenaRecord, parentPath: string, name: string) => {
  const nodeDef = Surveys.getNodeDefByName({ survey, name })
  const parentNode = getNode(survey, record, parentPath)
  return (await RecordUpdater.createNodeAndDescendants({ user, survey, record, parentNode, nodeDef })).record
}

const updateValue = async (params: {
  survey: Survey
  record: ArenaRecord
  path: string
  value: any
  dateModified: string
}): Promise<ArenaRecord> => {
  const { survey, record, path, value, dateModified } = params
  const attributeUuid = getNode(survey, record, path).uuid
  return (await RecordUpdater.updateAttributeValue({ user, survey, record, attributeUuid, value, dateModified })).record
}

describe('RecordUpdater - nodeDateLastModified', () => {
  beforeAll(async () => {
    user = createTestAdminUser()
  }, 10000)

  test('returns the latest modified date among the entity descendants', async () => {
    const survey = await createSurvey()
    let record = await createRecord(survey)
    record = await addEntity(survey, record, 'root_entity', 'plot')
    record = await addEntity(survey, record, 'root_entity', 'plot')
    record = await addEntity(survey, record, 'root_entity.plot[0]', 'tree')
    record = await addEntity(survey, record, 'root_entity.plot[1]', 'tree')

    const date1 = '2099-01-01T10:00:00.000Z'
    const date2 = '2099-02-01T10:00:00.000Z'

    record = await updateValue({
      survey,
      record,
      path: 'root_entity.plot[0].tree[0].height',
      value: 10,
      dateModified: date1,
    })
    expect(getValue(survey, record, 'root_entity.plot[0].plot_update')).toBe(date1)
    expect(getValue(survey, record, 'root_entity.record_update')).toBe(date1)

    record = await updateValue({
      survey,
      record,
      path: 'root_entity.plot[1].tree[0].height',
      value: 20,
      dateModified: date2,
    })
    expect(getValue(survey, record, 'root_entity.plot[0].plot_update')).toBe(date1)
    expect(getValue(survey, record, 'root_entity.plot[1].plot_update')).toBe(date2)
    expect(getValue(survey, record, 'root_entity.record_update')).toBe(date2)
  })

  test('ignores the evaluated node and the read-only attributes with default values', async () => {
    const survey = await createSurvey()
    let record = await createRecord(survey)
    record = await addEntity(survey, record, 'root_entity', 'plot')

    const dateData = '2099-01-01T10:00:00.000Z'
    const dateStamps = '2099-12-31T10:00:00.000Z'

    record = await updateValue({
      survey,
      record,
      path: 'root_entity.plot[0].plot_id',
      value: 1,
      dateModified: dateData,
    })
    getNode(survey, record, 'root_entity.plot[0].plot_update').dateModified = dateStamps
    const recordUpdateNode = getNode(survey, record, 'root_entity.record_update')
    recordUpdateNode.dateModified = dateStamps

    const nodeContext = Records.getRoot(record)!
    const result = await new RecordExpressionEvaluator().evaluate('nodeDateLastModified(root_entity)', {
      user,
      survey,
      record,
      nodeContext,
      nodeCurrent: recordUpdateNode,
      object: nodeContext,
    })
    expect(result).toBe(dateData)
  })
})
