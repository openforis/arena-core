import { beforeAll, describe, test, expect } from '@jest/globals'

import { SurveyBuilder, SurveyObjectBuilders } from '../../tests/builder/surveyBuilder'
import { RecordBuilder, RecordNodeBuilders } from '../../tests/builder/recordBuilder'
import * as RecordNodesUpdater from './recordNodesUpdater'
import { RecordUpdater } from '../recordUpdater'
import { User } from '../../auth'
import { Nodes } from '../../node'
import { createTestAdminUser } from '../../tests/data'
import { TestUtils } from '../../tests/testUtils'
import { Records } from '../records'
import { Surveys } from '../../survey'

const { entityDef, integerDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

let user: User

describe('Record nodes updater - editable/visible', () => {
  beforeAll(async () => {
    user = createTestAdminUser()
  }, 10000)

  test('Editable and visible metadata update', async () => {
    const survey = await new SurveyBuilder(
      user,
      entityDef(
        'root_entity',
        integerDef('identifier').key(),
        integerDef('source_attribute'),
        integerDef('dependent_editable_attribute').editableIf('source_attribute > 10'),
        integerDef('dependent_visible_attribute').visibleIf('source_attribute > 10')
      )
    ).build()

    let record = new RecordBuilder(
      user,
      survey,
      entity(
        'root_entity',
        attribute('identifier', 10),
        attribute('source_attribute', 20),
        attribute('dependent_editable_attribute', 111),
        attribute('dependent_visible_attribute', 222)
      )
    ).build()

    const sourceNode = TestUtils.getNodeByPath({ survey, record, path: 'root_entity.source_attribute' })
    const dependentEditableDef = Surveys.getNodeDefByName({ survey, name: 'dependent_editable_attribute' })
    const dependentVisibleDef = Surveys.getNodeDefByName({ survey, name: 'dependent_visible_attribute' })

    const sourceNodeUpdatedToFalse = { ...sourceNode, value: 5 }
    let updateResult = await RecordNodesUpdater.updateNodesDependents({
      user,
      survey,
      record: Records.addNode(sourceNodeUpdatedToFalse)(record),
      nodes: { [sourceNode.uuid]: sourceNodeUpdatedToFalse },
    })

    let rootNodeUpdated = TestUtils.getNodeByPath({ survey, record: updateResult.record, path: 'root_entity' })

    expect(Nodes.isChildEditable(rootNodeUpdated, dependentEditableDef.uuid)).toBe(false)
    expect(Nodes.isChildVisible(rootNodeUpdated, dependentVisibleDef.uuid)).toBe(false)
    expect(rootNodeUpdated.meta?.cEdit?.[dependentEditableDef.uuid]).toBe(false)
    expect(rootNodeUpdated.meta?.cVis?.[dependentVisibleDef.uuid]).toBe(false)

    record = updateResult.record

    const sourceNodeUpdatedToTrue = {
      ...TestUtils.getNodeByPath({ survey, record, path: 'root_entity.source_attribute' }),
      value: 20,
    }
    updateResult = await RecordNodesUpdater.updateNodesDependents({
      user,
      survey,
      record: Records.addNode(sourceNodeUpdatedToTrue)(record),
      nodes: { [sourceNodeUpdatedToTrue.uuid]: sourceNodeUpdatedToTrue },
    })

    rootNodeUpdated = TestUtils.getNodeByPath({ survey, record: updateResult.record, path: 'root_entity' })

    expect(Nodes.isChildEditable(rootNodeUpdated, dependentEditableDef.uuid)).toBe(true)
    expect(Nodes.isChildVisible(rootNodeUpdated, dependentVisibleDef.uuid)).toBe(true)
    expect(rootNodeUpdated.meta?.cEdit?.[dependentEditableDef.uuid]).toBeUndefined()
    expect(rootNodeUpdated.meta?.cVis?.[dependentVisibleDef.uuid]).toBeUndefined()
  })

  test('Nested multiple entities - deep entity editableIf root attribute condition', async () => {
    const survey = await new SurveyBuilder(
      user,
      entityDef(
        'root_entity',
        integerDef('identifier').key(),
        integerDef('threshold'),
        entityDef(
          'plot',
          integerDef('plot_id').key(),
          entityDef('subplot', integerDef('subplot_id').key()).multiple().editableIf('threshold > 10')
        ).multiple()
      )
    ).build()

    // Build an initial record with threshold = 5 (condition NOT met) and one plot
    const record = new RecordBuilder(
      user,
      survey,
      entity(
        'root_entity',
        attribute('identifier', 1),
        attribute('threshold', 5),
        entity('plot', attribute('plot_id', 1))
      )
    ).build()

    const subplotDef = Surveys.getNodeDefByName({ survey, name: 'subplot' })

    // Get the existing plot entity and create a subplot inside it (condition not met)
    const plotNode = TestUtils.getNodeByPath({ survey, record, path: 'root_entity.plot[0]' })

    const createResult = await RecordUpdater.createNodeAndDescendants({
      user,
      survey,
      record,
      parentNode: plotNode,
      nodeDef: subplotDef,
    })

    const recordAfterCreate = createResult.record

    // The plot node should have the new subplot marked as not editable (cEdit = false)
    const plotNodeAfterCreate = TestUtils.getNodeByPath({
      survey,
      record: recordAfterCreate,
      path: 'root_entity.plot[0]',
    })
    expect(Nodes.isChildEditable(plotNodeAfterCreate, subplotDef.uuid)).toBe(false)
    expect(plotNodeAfterCreate.meta?.cEdit?.[subplotDef.uuid]).toBe(false)

    // Now update threshold to 20 (condition met) and check the plot node reflects editability
    const thresholdNode = TestUtils.getNodeByPath({ survey, record: recordAfterCreate, path: 'root_entity.threshold' })
    const thresholdUpdated = { ...thresholdNode, value: 20 }
    const recordWithThreshold = Records.addNode(thresholdUpdated)(recordAfterCreate)

    const updateResult = await RecordNodesUpdater.updateNodesDependents({
      user,
      survey,
      record: recordWithThreshold,
      nodes: { [thresholdNode.uuid]: thresholdUpdated },
    })

    const plotNodeAfterUpdate = TestUtils.getNodeByPath({
      survey,
      record: updateResult.record,
      path: 'root_entity.plot[0]',
    })
    expect(Nodes.isChildEditable(plotNodeAfterUpdate, subplotDef.uuid)).toBe(true)
    expect(plotNodeAfterUpdate.meta?.cEdit?.[subplotDef.uuid]).toBeUndefined()
  })
})
