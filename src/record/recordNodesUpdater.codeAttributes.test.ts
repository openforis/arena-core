import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { RecordBuilder, RecordNodeBuilders } from '../tests/builder/recordBuilder'

const { category, categoryItem, codeDef, entityDef, integerDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

import { RecordNodesUpdater } from './recordNodesUpdater'
import { createTestAdminUser } from '../tests/data'
import { TestUtils } from '../tests/testUtils'
import { User } from '../auth'
import { Records } from './records'
import { Surveys } from '../survey'

let user: User

describe('Record nodes updater - dependent code attributes', () => {
  beforeAll(async () => {
    user = createTestAdminUser()
  }, 10000)

  test('Dependent code attributes value reset', () => {
    const categoryName = 'hierarchical_category'

    const survey = new SurveyBuilder(
      user,
      entityDef(
        'root_entity',
        integerDef('identifier').key(),
        codeDef('parent_code', 'hierarchical_category'),
        codeDef('dependent_code', 'hierarchical_category').parentCodeAttribute('parent_code')
      )
    )
      .categories(
        category(categoryName)
          .levels('level_1', 'level_2')
          .items(
            categoryItem('1').items(categoryItem('1a')),
            categoryItem('2').items(categoryItem('2a'), categoryItem('2b'), categoryItem('2c')),
            categoryItem('3').items(categoryItem('3a'))
          )
      )
      .build()

    const hierarchicalCategory = Surveys.getCategoryByName({ survey, categoryName })
    if (!hierarchicalCategory) throw new Error(`Could not find category ${categoryName}`)

    const item1a = Surveys.getCategoryItemByCodePaths({
      survey,
      categoryUuid: hierarchicalCategory.uuid,
      codePaths: ['1', '1a'],
    })
    if (!item1a) throw new Error(`Could not find category item [1, 1a]`)

    const record = new RecordBuilder(
      user,
      survey,
      entity(
        'root_entity',
        attribute('identifier', 10),
        attribute('parent_code', '1'),
        attribute('dependent_code', { itemUuid: item1a.uuid })
      )
    ).build()

    // check initial value of dependent node
    const dependentNodePath = 'root_entity.dependent_code'
    const dependentNode = TestUtils.getNodeByPath({
      survey,
      record,
      path: dependentNodePath,
    })
    expect(dependentNode).not.toBeNull()
    expect(dependentNode.value).toEqual({ itemUuid: item1a.uuid })

    // update source node value
    const nodeToUpdate = TestUtils.getNodeByPath({ survey, record, path: 'root_entity.parent_code' })
    const nodeUpdated = { ...nodeToUpdate, value: 2 }
    const recordUpdated = Records.addNode(nodeUpdated)(record)

    const updateResult = RecordNodesUpdater.updateNodesDependents({
      survey,
      record: recordUpdated,
      nodes: { [nodeToUpdate.uuid]: nodeUpdated },
    })
    expect(updateResult).not.toBeNull()

    // check nodes being updated
    expect(
      Object.values(updateResult.nodes)
        .map((updatedNode) => Surveys.getNodeDefByUuid({ survey, uuid: updatedNode.nodeDefUuid }).props.name)
        .sort()
    ).toEqual(['dependent_code', 'parent_code'])

    // check that dependent node value has been reset
    const dependentNodeUpdated = TestUtils.getNodeByPath({
      survey,
      record: updateResult.record,
      path: dependentNodePath,
    })
    expect(dependentNodeUpdated).not.toBeNull()
    expect(dependentNodeUpdated.value).toBeNull()
  })
})
