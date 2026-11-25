import { beforeAll, describe, expect, test } from '@jest/globals'

import { ArenaUser } from '../auth'
import { ArenaSurvey, SurveyDependencyType, Surveys } from '../survey'
import { RecordBuilder, RecordNodeBuilders } from '../tests/builder/recordBuilder'
import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { createTestAdminUser } from '../tests/data'
import { TestUtils } from '../tests/testUtils'
import { ArenaRecord } from './record'
import { RecordUpdater } from './recordUpdater'
import { Records } from './records'

const { entityDef, integerDef, textDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

const dateModified1 = '2100-01-01T00:00:00.000Z'
const dateModified2 = '2100-01-02T00:00:00.000Z'

let user: ArenaUser
let survey: ArenaSurvey

const getNode = (record: ArenaRecord, path: string) => TestUtils.getNodeByPath({ survey, record, path })

const getNodeDefName = (uuid: string): string | undefined => Surveys.getNodeDefByUuid({ survey, uuid }).props.name

const plot = (plotId: number, notes: string) =>
  entity(
    'plot',
    attribute('plot_id', plotId),
    attribute('plot_notes', notes),
    attribute('plot_last_modified', null),
    attribute('plot_notes_last_modified', null),
    attribute('plot_created', null)
  )

const createRecord = (): ArenaRecord =>
  new RecordBuilder(
    user,
    survey,
    entity(
      'root_entity',
      attribute('identifier', 10),
      plot(1, 'a'),
      plot(2, 'b'),
      attribute('record_last_modified', null)
    )
  ).build()

describe('RecordUpdater - node dates', () => {
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
          textDef('plot_notes'),
          textDef('plot_last_modified').readOnly().defaultValue('nodeDateModified(parent(this))'),
          textDef('plot_notes_last_modified').readOnly().defaultValue('nodeDateModified(plot_notes)'),
          textDef('plot_created').readOnly().defaultValue('nodeDateCreated(parent(this))')
        ).multiple(),
        textDef('record_last_modified').readOnly().defaultValue('nodeDateModified(parent(this))')
      )
    ).build()
  }, 10000)

  test('dependencies: entities in the nodeDates graph', () => {
    const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' })
    const rootDef = Surveys.getNodeDefRoot({ survey })
    const plotNotesDef = Surveys.getNodeDefByName({ survey, name: 'plot_notes' })

    const getDependentNames = (nodeDefUuid: string, dependencyType: SurveyDependencyType) =>
      Surveys.getNodeDefDependents({ survey, nodeDefUuid, dependencyType })
        .map((nodeDef) => nodeDef.props.name)
        .sort()

    expect(getDependentNames(plotDef.uuid, SurveyDependencyType.nodeDates)).toEqual([
      'plot_created',
      'plot_last_modified',
    ])
    expect(getDependentNames(rootDef.uuid, SurveyDependencyType.nodeDates)).toEqual(['record_last_modified'])
    // attributes: dependencies of the expression type (their date modified changes with their value)
    expect(getDependentNames(plotNotesDef.uuid, SurveyDependencyType.defaultValues)).toEqual([
      'plot_notes_last_modified',
    ])
  })

  test('attribute update: ancestors date modified updated and dependent expressions evaluated again', async () => {
    const record = createRecord()
    const plot2Before = getNode(record, 'root_entity.plot[1]')
    const plotNotes = getNode(record, 'root_entity.plot[0].plot_notes')

    const updateResult = await RecordUpdater.updateAttributeValue({
      user,
      survey,
      record,
      attributeUuid: plotNotes.uuid,
      value: 'c',
      dateModified: dateModified1,
    })
    const { record: recordUpdated } = updateResult

    expect(getNode(recordUpdated, 'root_entity').dateModified).toBe(dateModified1)
    expect(getNode(recordUpdated, 'root_entity.plot[0]').dateModified).toBe(dateModified1)
    expect(getNode(recordUpdated, 'root_entity.plot[0].plot_last_modified').value).toBe(dateModified1)
    expect(getNode(recordUpdated, 'root_entity.plot[0].plot_notes_last_modified').value).toBe(dateModified1)
    expect(getNode(recordUpdated, 'root_entity.record_last_modified').value).toBe(dateModified1)
    // the creation date doesn't change
    expect(getNode(recordUpdated, 'root_entity.plot[0].plot_created').value).toBe(
      getNode(record, 'root_entity.plot[0]').dateCreated
    )
    // sibling entity not modified
    expect(getNode(recordUpdated, 'root_entity.plot[1]').dateModified).toBe(plot2Before.dateModified)
    expect(getNode(recordUpdated, 'root_entity.plot[1].plot_last_modified').value).toBeNull()

    // ancestors returned (to be persisted) but only updated in their date modified
    const rootUuid = getNode(recordUpdated, 'root_entity').uuid
    const plot1Uuid = getNode(recordUpdated, 'root_entity.plot[0]').uuid
    expect(updateResult.nodes[rootUuid]).toBeDefined()
    expect(updateResult.nodes[plot1Uuid]).toBeDefined()
    expect(
      [...updateResult.dateModifiedOnlyNodeUuids]
        .map((uuid) => getNodeDefName(Records.getNodeByUuid(uuid)(recordUpdated)!.nodeDefUuid))
        .sort()
    ).toEqual(['plot', 'root_entity'])
  })

  test('entity creation: ancestors date modified updated', async () => {
    const record = createRecord()
    const root = getNode(record, 'root_entity')
    const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' })

    const { record: recordUpdated } = await RecordUpdater.createNodeAndDescendants({
      user,
      survey,
      record,
      parentNode: root,
      nodeDef: plotDef,
      dateModified: dateModified1,
    })
    expect(getNode(recordUpdated, 'root_entity').dateModified).toBe(dateModified1)
    expect(getNode(recordUpdated, 'root_entity.record_last_modified').value).toBe(dateModified1)
    const plotNew = getNode(recordUpdated, 'root_entity.plot[2]')
    expect(plotNew.dateModified).toBe(dateModified1)
    expect(getNode(recordUpdated, 'root_entity.plot[2].plot_last_modified').value).toBe(dateModified1)
    expect(getNode(recordUpdated, 'root_entity.plot[2].plot_created').value).toBe(plotNew.dateCreated)
  })

  test('entity deletion: ancestors date modified updated', async () => {
    let record = createRecord()
    const plotNotes = getNode(record, 'root_entity.plot[0].plot_notes')
    record = (
      await RecordUpdater.updateAttributeValue({
        user,
        survey,
        record,
        attributeUuid: plotNotes.uuid,
        value: 'c',
        dateModified: dateModified1,
      })
    ).record
    const plot2 = getNode(record, 'root_entity.plot[1]')

    const { record: recordUpdated } = await RecordUpdater.deleteNode({
      user,
      survey,
      record,
      nodeUuid: plot2.uuid,
      dateModified: dateModified2,
    })
    expect(getNode(recordUpdated, 'root_entity').dateModified).toBe(dateModified2)
    expect(getNode(recordUpdated, 'root_entity.record_last_modified').value).toBe(dateModified2)
    // remaining plot not modified
    expect(getNode(recordUpdated, 'root_entity.plot[0]').dateModified).toBe(dateModified1)
    expect(getNode(recordUpdated, 'root_entity.plot[0].plot_last_modified').value).toBe(dateModified1)
  })
})
