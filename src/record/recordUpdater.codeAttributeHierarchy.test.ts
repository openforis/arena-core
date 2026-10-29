import { describe, test, expect } from '@jest/globals'

import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { createTestAdminUser } from '../tests/data'
import { TestUtils } from '../tests/testUtils'
import { CategoryItemFactory } from '../category'
import { NodeValues, Nodes } from '../node'
import { NodeDefCode } from '../nodeDef'
import { Survey, Surveys } from '../survey'
import { ArenaRecord } from './record'
import { RecordCloner } from './recordCloner'
import { RecordFactory } from './factory'
import { RecordUpdater } from './recordUpdater'
import { Records } from './records'

const { category, categoryItem, codeDef, entityDef, integerDef } = SurveyObjectBuilders

const user = createTestAdminUser()
const categoryName = 'admin_unit'

const createSurvey = (): Promise<Survey> =>
  new SurveyBuilder(
    user,
    entityDef(
      'root_entity',
      integerDef('identifier').key(),
      codeDef('region', categoryName),
      codeDef('province', categoryName).parentCodeAttribute('region'),
      codeDef('city', categoryName).parentCodeAttribute('province')
    )
  )
    .categories(
      category(categoryName)
        .levels('region', 'province', 'city')
        .items(
          categoryItem('1').items(categoryItem('1a').items(categoryItem('1a1'))),
          categoryItem('2').items(categoryItem('2a').items(categoryItem('2a1')))
        )
    )
    .build()

describe('RecordUpdater - code attributes hierarchy (meta.hCode)', () => {
  test('created code attributes depend on their ancestor code attributes; clone keeps the dependency', async () => {
    const survey = await createSurvey()
    let record: ArenaRecord = RecordFactory.createInstance({ surveyUuid: survey.uuid, user })
    record = (await RecordUpdater.createRootEntity({ user, survey, record })).record

    const getNode = (rec: ArenaRecord, name: string) => TestUtils.getNodeByPath({ survey, record: rec, path: name })
    const region = getNode(record, 'region')
    const province = getNode(record, 'province')
    const city = getNode(record, 'city')
    expect(Nodes.getHierarchyCode(city)).toEqual([region.uuid, province.uuid])

    const setCode = async (attributeUuid: string, codePaths: string[]) => {
      const item = TestUtils.getCategoryItem({ survey, categoryName, codePaths })
      const value = NodeValues.newCodeValue({ itemUuid: item.uuid })
      record = (await RecordUpdater.updateAttributeValue({ user, survey, record, attributeUuid, value })).record
    }
    await setCode(region.uuid, ['1'])
    await setCode(province.uuid, ['1', '1a'])
    await setCode(city.uuid, ['1', '1a', '1a1'])
    await setCode(region.uuid, ['2'])

    expect(getNode(record, 'province').value).toBeNull()
    expect(getNode(record, 'city').value).toBeNull()

    const { record: recordCloned } = RecordCloner.cloneRecord({ survey, record, cycleTo: '0' })
    const regionCloned = getNode(recordCloned, 'region')
    const provinceCloned = getNode(recordCloned, 'province')
    expect(Nodes.getHierarchyCode(getNode(recordCloned, 'city'))).toEqual([regionCloned.uuid, provinceCloned.uuid])
  })

  test('ancestor code path uses the category items in the node ref data (items not in the survey ref data)', async () => {
    const survey = await createSurvey()
    let record: ArenaRecord = RecordFactory.createInstance({ surveyUuid: survey.uuid, user })
    record = (await RecordUpdater.createRootEntity({ user, survey, record })).record

    const root = Records.getRoot(record)!
    const region = TestUtils.getNodeByPath({ survey, record, path: 'region' })
    // item of a big category: not in the survey ref data
    const bigCategoryItem = CategoryItemFactory.createInstance({ levelUuid: 'level_uuid', props: { code: '9' } })
    record = Records.addNode({
      ...region,
      value: NodeValues.newCodeValue({ itemUuid: bigCategoryItem.uuid }),
      refData: { categoryItem: bigCategoryItem },
    })(record)

    const cityDef = Surveys.getNodeDefByName({ survey, name: 'city' }) as NodeDefCode
    expect(Records.getAncestorCodePath(survey, root, cityDef)(record)).toEqual(['9', ''])
  })
})
