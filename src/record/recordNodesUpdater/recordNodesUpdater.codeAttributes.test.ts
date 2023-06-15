/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { SurveyBuilder, SurveyObjectBuilders } from '../../tests/builder/surveyBuilder'
import { RecordBuilder, RecordNodeBuilders } from '../../tests/builder/recordBuilder'

const { category, categoryItem, codeDef, entityDef, integerDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

import { RecordNodesUpdater } from '../recordNodesUpdater'
import { createTestAdminUser } from '../../tests/data'
import { TestUtils } from '../../tests/testUtils'
import { User } from '../../auth'
import { Records } from './../records'
import { Surveys } from '../../survey'
import { ExtraPropDataType } from '../../extraProp'
import { NodeValues } from '../../node/nodeValues'

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

    const item1a = TestUtils.getCategoryItem({ survey, categoryName, codePaths: ['1', '1a'] })

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

  test('Hierarchical read-only code attributes evaluation', () => {
    const categoryName = 'admin_unit'

    const survey = new SurveyBuilder(
      user,
      entityDef(
        'root_entity',
        codeDef('identifier', 'sampling_point_data').key(),
        codeDef('region', categoryName)
          .readOnly()
          .defaultValue(`categoryItemProp('sampling_point_data', 'region_code', identifier)`),
        codeDef('province', categoryName)
          .parentCodeAttribute('region')
          .readOnly()
          .defaultValue(`categoryItemProp('sampling_point_data', 'province_code', identifier)`),
        codeDef('city', categoryName)
          .parentCodeAttribute('province')
          .readOnly()
          .defaultValue(`categoryItemProp('sampling_point_data', 'city_code', identifier)`)
      )
    )
      .categories(
        category('sampling_point_data')
          .levels('cluster')
          .extraProps({
            location: { key: 'location', dataType: ExtraPropDataType.geometryPoint },
            region_code: { key: 'region_code', dataType: ExtraPropDataType.text },
            province_code: { key: 'province_code', dataType: ExtraPropDataType.text },
            city_code: { key: 'city_code', dataType: ExtraPropDataType.text },
          })
          .items(
            categoryItem('11').extra({
              location: 'SRID=EPSG:4326;POINT(12.89463 42.00048)',
              region_code: '2',
              province_code: '2_b',
              city_code: '2_b_2',
            }),
            categoryItem('12').extra({
              location: 'SRID=EPSG:4326;POINT(12.99463 42.00048)',
              region_code: '3',
              province_code: '3_a',
              city_code: '3_a_1',
            }),
            categoryItem('13').extra({ location: 'SRID=EPSG:4326;POINT(13.09463 42.00048)' })
          ),
        category(categoryName)
          .levels('level_1', 'level_2', 'level_3')
          .items(
            categoryItem('1').items(categoryItem('1_a')),
            categoryItem('2').items(
              categoryItem('2_a').items(categoryItem('2_a_1'), categoryItem('2_a_2'), categoryItem('2_a_3')),
              categoryItem('2_b').items(categoryItem('2_b_1'), categoryItem('2_b_2')),
              categoryItem('2_c').items(
                categoryItem('2_c_1'),
                categoryItem('2_c_2'),
                categoryItem('2_c_3'),
                categoryItem('2_c_4')
              )
            ),
            categoryItem('3').items(
              categoryItem('3_a').items(categoryItem('3_a_1'), categoryItem('3_a_2')),
              categoryItem('3_b').items(categoryItem('3_b_1'), categoryItem('3_b_2'))
            )
          )
      )
      .build()

    let record = new RecordBuilder(
      user,
      survey,
      entity('root_entity', attribute('identifier'), attribute('region'), attribute('province'), attribute('city'))
    ).build()

    const getItemUuid = (categoryName: string, codePaths: string[]): string => {
      const category = Surveys.getCategoryByName({ survey, categoryName })
      const item = Surveys.getCategoryItemByCodePaths({ survey, categoryUuid: category!.uuid, codePaths })
      return item!.uuid
    }
    const expectCodeToBe = (params: { path: string; itemCodes: string[] }) => {
      const { path, itemCodes } = params
      const codeAttr = TestUtils.getNodeByPath({ survey, record, path })
      expect(codeAttr).not.toBeNull()
      const itemUuid = getItemUuid(categoryName, itemCodes)
      expect(codeAttr.value.itemUuid).toBe(itemUuid)
    }
    const updateSourceValue = (value: string) => {
      const nodeToUpdate = TestUtils.getNodeByPath({ survey, record, path: 'root_entity.identifier' })

      const samplingPointDataItemUuid = getItemUuid('sampling_point_data', [value])
      const nodeUpdated = { ...nodeToUpdate, value: NodeValues.newCodeValue({ itemUuid: samplingPointDataItemUuid }) }
      const recordUpdated = Records.addNode(nodeUpdated)(record)

      const updateResult = RecordNodesUpdater.updateNodesDependents({
        survey,
        record: recordUpdated,
        nodes: { [nodeToUpdate.uuid]: nodeUpdated },
      })
      expect(updateResult).not.toBeNull()

      record = updateResult.record
    }

    updateSourceValue('11')
    expectCodeToBe({ path: 'root_entity.region', itemCodes: ['2'] })
    expectCodeToBe({ path: 'root_entity.province', itemCodes: ['2', '2_b'] })
    expectCodeToBe({ path: 'root_entity.city', itemCodes: ['2', '2_b', '2_b_2'] })

    updateSourceValue('12')
    expectCodeToBe({ path: 'root_entity.region', itemCodes: ['3'] })
    expectCodeToBe({ path: 'root_entity.province', itemCodes: ['3', '3_a'] })
    expectCodeToBe({ path: 'root_entity.city', itemCodes: ['3', '3_a', '3_a_1'] })
  })
})
