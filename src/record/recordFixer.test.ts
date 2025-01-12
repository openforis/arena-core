import { Survey, Surveys } from '../survey'

import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { RecordBuilder, RecordNodeBuilders } from '../tests/builder/recordBuilder'
import { createTestAdminUser } from '../tests/data'
import { TestUtils } from '../tests/testUtils'

const { entityDef, integerDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

import { Record } from './record'
import { RecordFixer } from './recordFixer'
import { Records } from './records'
import { RecordUpdater } from './recordUpdater'
import { Nodes } from '../node'

const user = createTestAdminUser()
let survey: Survey
let record: Record

const deleteNodeDef = (params: { survey: Survey; parentUuid: string; uuid: string }) => {
  const { survey, parentUuid, uuid } = params
  delete survey.nodeDefs?.[uuid]
  delete survey.nodeDefsIndex?.childDefUuidPresenceByParentUuid?.[parentUuid]?.[uuid]
}

describe('Record fixer', () => {
  beforeAll(async () => {
    survey = new SurveyBuilder(
      user,
      entityDef(
        'cluster',
        integerDef('cluster_id').key(),
        integerDef('cluster_attr').applyIf('cluster_id > 10'),
        entityDef('plot', integerDef('plot_id').key(), integerDef('plot_attr')).multiple()
      )
    ).build()

    record = new RecordBuilder(
      user,
      survey,
      entity(
        'cluster',
        attribute('cluster_id', 5),
        attribute('cluster_attr', 100),
        entity('plot', attribute('plot_id', 1), attribute('plot_attr', 10)),
        entity('plot', attribute('plot_id', 2), attribute('plot_attr', 20)),
        entity('plot', attribute('plot_id', 3), attribute('plot_attr', 30))
      )
    ).build()
  }, 10000)

  test('node definition removed => record nodes removed', async () => {
    // prepare record: update cluster_id = 6 => cluster_attr not applicable
    const clusterIdAttr = TestUtils.getNodeByPath({ survey, record, path: 'cluster.cluster_id' })
    const { record: recordUpdated } = await RecordUpdater.updateAttributeValue({
      user,
      survey,
      record,
      attributeUuid: clusterIdAttr.uuid,
      value: 6,
    })
    record = recordUpdated

    const rootDef = Surveys.getNodeDefRoot({ survey })
    const clusterAttrDef = Surveys.getNodeDefByName({ survey, name: 'cluster_attr' })
    const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' })
    const plotAttrDef = Surveys.getNodeDefByName({ survey, name: 'plot_attr' })
    const clusterAttrDefUuid = clusterAttrDef.uuid
    const plotAttrDefUuid = plotAttrDef.uuid

    let rootNode = Records.getRoot(record)!
    expect(Nodes.isChildApplicable(rootNode, clusterAttrDefUuid)).toBeFalsy()

    // delete cluster_attr def and plot_attr
    deleteNodeDef({ survey, parentUuid: rootDef.uuid, uuid: clusterAttrDefUuid })
    deleteNodeDef({ survey, parentUuid: plotDef.uuid, uuid: plotAttrDefUuid })

    // fix record
    const fixResult = RecordFixer.fixRecord({ survey, record })
    expect(Object.values(fixResult.nodesDeleted).length).toBe(4)
    record = fixResult.record

    // test nodes deleted from record
    const clusterAttr = TestUtils.findNodeByPath({ survey, record, path: 'cluster.cluster_attr' })
    expect(clusterAttr).toBeUndefined()
    const plotAttr1 = TestUtils.findNodeByPath({ survey, record, path: 'cluster.plot[0].plot_attr' })
    expect(plotAttr1).toBeUndefined()

    // test applicability cleared (applicable = true by default)
    rootNode = Records.getRoot(record)!
    expect(Nodes.isChildApplicable(rootNode, clusterAttrDefUuid)).toBeTruthy()
  })
})
