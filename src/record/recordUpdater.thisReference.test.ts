import { beforeAll, describe, expect, test } from '@jest/globals'

import { ArenaUser } from '../auth'
import { ArenaSurvey } from '../survey'
import { RecordBuilder, RecordNodeBuilders } from '../tests/builder/recordBuilder'
import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { createTestAdminUser } from '../tests/data'
import { TestUtils } from '../tests/testUtils'
import { ArenaRecord } from './record'
import { RecordUpdater } from './recordUpdater'
import { Records } from './records'

const { entityDef, integerDef, textDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

let user: ArenaUser
let survey: ArenaSurvey

const getNode = (record: ArenaRecord, path: string) => TestUtils.getNodeByPath({ survey, record, path })

// "this" in the expressions of a node def refers to the node of the node def (not to its parent entity)
describe('RecordUpdater - "this" in node def expressions', () => {
  beforeAll(async () => {
    user = createTestAdminUser()
    survey = await new SurveyBuilder(
      user,
      entityDef(
        'root_entity',
        integerDef('identifier').key(),
        entityDef(
          'plot',
          integerDef('plot_id').key(),
          integerDef('plot_id_double').readOnly().defaultValue('parent(this).plot_id * 2'),
          integerDef('plot_id_multiple').multiple().defaultValue('parent(this).plot_id * 10 + index(this)'),
          textDef('plot_notes').applyIf('parent(this).plot_id > 1')
        ).multiple()
      )
    ).build()
  }, 10000)

  test('default values and applicability', async () => {
    const record = new RecordBuilder(
      user,
      survey,
      entity(
        'root_entity',
        attribute('identifier', 10),
        entity(
          'plot',
          attribute('plot_id', 1),
          attribute('plot_id_double', null),
          attribute('plot_id_multiple', null),
          attribute('plot_id_multiple', null),
          attribute('plot_notes', null)
        )
      )
    ).build()
    const plotId = getNode(record, 'root_entity.plot[0].plot_id')

    const { record: recordUpdated } = await RecordUpdater.updateAttributeValue({
      user,
      survey,
      record,
      attributeUuid: plotId.uuid,
      value: 2,
    })
    expect(getNode(recordUpdated, 'root_entity.plot[0].plot_id_double').value).toBe(4)
    // multiple attribute: "this" is every node
    expect(getNode(recordUpdated, 'root_entity.plot[0].plot_id_multiple[0]').value).toBe(20)
    expect(getNode(recordUpdated, 'root_entity.plot[0].plot_id_multiple[1]').value).toBe(21)
    const plotNotes = getNode(recordUpdated, 'root_entity.plot[0].plot_notes')
    expect(Records.isNodeApplicable(plotNotes)(recordUpdated)).toBe(true)
  })
})
