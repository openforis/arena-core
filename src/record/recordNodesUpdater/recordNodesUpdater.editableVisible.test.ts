import { SurveyBuilder, SurveyObjectBuilders } from '../../tests/builder/surveyBuilder'
import { RecordBuilder, RecordNodeBuilders } from '../../tests/builder/recordBuilder'
import * as RecordNodesUpdater from './recordNodesUpdater'
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
        integerDef('dependent_editable_attribute').editableWhen('source_attribute > 10'),
        integerDef('dependent_visible_attribute').visibleWhen('source_attribute > 10')
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
})
