import { beforeAll, describe, expect, test } from '@jest/globals'

import { User } from '../auth'
import { ArenaRecordNode, Nodes } from '../node'
import { NodeDefExpressionFactory } from '../nodeDef/nodeDef'
import { Survey, Surveys } from '../survey'
import { RecordBuilder, RecordNodeBuilders } from '../tests/builder/recordBuilder'
import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { createTestAdminUser } from '../tests/data'
import { TestUtils } from '../tests/testUtils'
import { Validations } from '../validation'
import { ArenaRecord } from './record'
import { RecordFactory } from './factory'
import { RecordNodesUpdater } from './recordNodesUpdater'
import { RecordUpdater } from './recordUpdater'
import { RecordValidator } from './recordValidator'
import { Records } from './records'

const { entityDef, integerDef, textDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

let user: User

const createSurvey = async (): Promise<Survey> =>
  new SurveyBuilder(
    user,
    entityDef(
      'root_entity',
      integerDef('identifier').key(),
      integerDef('land_use'),
      textDef('remarks').requiredIf('land_use == 1'),
      entityDef(
        'tree',
        integerDef('tree_id').key(),
        integerDef('health'),
        textDef('damage').requiredIf(
          NodeDefExpressionFactory.createInstance({ expression: 'true', applyIf: 'health > 2' })
        )
      ).multiple()
    )
  ).build()

const hasValueRequiredError = (record: ArenaRecord, node: ArenaRecordNode): boolean => {
  const nodeValidation = Validations.getFieldValidation(node.uuid)(Validations.getValidation(record))
  const valueValidation = nodeValidation?.fields?.['value']
  return !!valueValidation?.errors?.some((error) => error.key === 'record.attribute.valueRequired')
}

const getNode = (survey: Survey, record: ArenaRecord, path: string) => TestUtils.getNodeByPath({ survey, record, path })

const updateValue = async (survey: Survey, record: ArenaRecord, path: string, value: any): Promise<ArenaRecord> => {
  const attributeUuid = getNode(survey, record, path).uuid
  const result = await RecordUpdater.updateAttributeValue({ user, survey, record, attributeUuid, value })
  return result.record
}

const isRequired = (survey: Survey, record: ArenaRecord, path: string): boolean => {
  const node = getNode(survey, record, path)
  const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: node.nodeDefUuid })
  return Records.isNodeRequired(nodeDef, node)(record)
}

const createRecord = async (survey: Survey): Promise<ArenaRecord> => {
  const record = RecordFactory.createInstance({ surveyUuid: survey.uuid, user })
  return (await RecordUpdater.createRootEntity({ user, survey, record })).record
}

const addTree = async (survey: Survey, record: ArenaRecord): Promise<ArenaRecord> => {
  const treeDef = Surveys.getNodeDefByName({ survey, name: 'tree' })
  const result = await RecordUpdater.createNodeAndDescendants({
    user,
    survey,
    record,
    parentNode: Records.getRoot(record),
    nodeDef: treeDef,
  })
  return result.record
}

describe('RecordUpdater - required if', () => {
  beforeAll(async () => {
    user = createTestAdminUser()
  }, 10000)

  test('condition evaluated on record creation and when the referenced attribute changes', async () => {
    const survey = await createSurvey()
    let record = await createRecord(survey)

    // condition not met (land_use empty)
    const remarksDefUuid = Surveys.getNodeDefByName({ survey, name: 'remarks' }).uuid
    expect(Nodes.isChildRequired(Records.getRoot(record)!, remarksDefUuid)).toBe(false)
    expect(isRequired(survey, record, 'remarks')).toBeFalsy()
    expect(hasValueRequiredError(record, getNode(survey, record, 'remarks'))).toBeFalsy()

    // condition met => required, value missing
    record = await updateValue(survey, record, 'land_use', 1)
    expect(isRequired(survey, record, 'remarks')).toBeTruthy()
    expect(hasValueRequiredError(record, getNode(survey, record, 'remarks'))).toBeTruthy()

    // value filled => valid
    record = await updateValue(survey, record, 'remarks', 'some remarks')
    expect(hasValueRequiredError(record, getNode(survey, record, 'remarks'))).toBeFalsy()

    // value cleared => error again
    record = await updateValue(survey, record, 'remarks', null)
    expect(hasValueRequiredError(record, getNode(survey, record, 'remarks'))).toBeTruthy()

    // condition not met anymore => valid
    record = await updateValue(survey, record, 'land_use', 2)
    expect(isRequired(survey, record, 'remarks')).toBeFalsy()
    expect(hasValueRequiredError(record, getNode(survey, record, 'remarks'))).toBeFalsy()
  })

  test('condition evaluated in the context of each parent entity (with applyIf)', async () => {
    const survey = await createSurvey()
    let record = await createRecord(survey)
    record = await addTree(survey, record)
    record = await addTree(survey, record)

    expect(isRequired(survey, record, 'tree[0].damage')).toBeFalsy()
    expect(isRequired(survey, record, 'tree[1].damage')).toBeFalsy()

    record = await updateValue(survey, record, 'tree[1].health', 3)
    expect(isRequired(survey, record, 'tree[0].damage')).toBeFalsy()
    expect(isRequired(survey, record, 'tree[1].damage')).toBeTruthy()
    expect(hasValueRequiredError(record, getNode(survey, record, 'tree[0].damage'))).toBeFalsy()
    expect(hasValueRequiredError(record, getNode(survey, record, 'tree[1].damage'))).toBeTruthy()

    record = await updateValue(survey, record, 'tree[1].health', 1)
    expect(isRequired(survey, record, 'tree[1].damage')).toBeFalsy()
    expect(hasValueRequiredError(record, getNode(survey, record, 'tree[1].damage'))).toBeFalsy()
  })

  test('only flags of conditions met are stored', async () => {
    const survey = await createSurvey()
    let record = await createRecord(survey)
    // no condition met: nothing stored
    expect(Records.getRoot(record)?.meta?.cReq).toBeUndefined()

    record = await updateValue(survey, record, 'land_use', 1)
    const remarksDefUuid = Surveys.getNodeDefByName({ survey, name: 'remarks' }).uuid
    expect(Records.getRoot(record)?.meta?.cReq).toEqual({ [remarksDefUuid]: true })

    // condition not met anymore: flag removed, empty dictionary kept (removed by the persistence layer)
    record = await updateValue(survey, record, 'land_use', 2)
    expect(Records.getRoot(record)?.meta?.cReq).toEqual({})
  })

  test('validation evaluates the condition even when the flag is missing (old records)', async () => {
    const survey = await createSurvey()
    // record built without running the record updater: no cReq flags
    const record = new RecordBuilder(
      user,
      survey,
      entity('root_entity', attribute('identifier', 1), attribute('land_use', 1), attribute('remarks', null))
    ).build()
    expect(Records.getRoot(record)?.meta?.cReq).toBeUndefined()

    const validation = await RecordValidator.validateRecord({ user, survey, record })
    const remarks = getNode(survey, record, 'remarks')
    expect(hasValueRequiredError({ ...record, validation }, remarks)).toBeTruthy()
  })

  test('updateRequiredFlags computes and removes flags', async () => {
    const survey = await createSurvey()
    const record = new RecordBuilder(
      user,
      survey,
      entity('root_entity', attribute('identifier', 1), attribute('land_use', 1), attribute('remarks', null))
    ).build()
    const remarksDefUuid = Surveys.getNodeDefByName({ survey, name: 'remarks' }).uuid

    const result = await RecordNodesUpdater.updateRequiredFlags({
      user,
      survey,
      record,
      nodeDefUuids: [remarksDefUuid],
    })
    expect(Nodes.isChildRequired(Records.getRoot(result.record)!, remarksDefUuid)).toBe(true)
    expect(Object.keys(result.nodes)).toEqual([Records.getRoot(result.record)!.uuid])

    // condition removed from the survey => flag removed
    const remarksDef = Surveys.getNodeDefByUuid({ survey, uuid: remarksDefUuid })
    const remarksDefUpdated = { ...remarksDef, propsAdvanced: { ...remarksDef.propsAdvanced, validations: {} } }
    const surveyUpdated: Survey = { ...survey, nodeDefs: { ...survey.nodeDefs, [remarksDefUuid]: remarksDefUpdated } }
    const result2 = await RecordNodesUpdater.updateRequiredFlags({
      user,
      survey: surveyUpdated,
      record: result.record,
      nodeDefUuids: [remarksDefUuid],
    })
    expect(Nodes.isChildRequired(Records.getRoot(result2.record)!, remarksDefUuid)).toBe(false)
    expect(Records.getRoot(result2.record)?.meta?.cReq).toEqual({})
  })
})
