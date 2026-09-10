import { describe, test, expect } from '@jest/globals'

import { Survey, Surveys } from '../survey'

import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { RecordBuilder, RecordNodeBuilders } from '../tests/builder/recordBuilder'
import { createTestAdminUser } from '../tests/data'
import { TestUtils } from '../tests/testUtils'

const { category, categoryItem, codeDef, entityDef, integerDef } = SurveyObjectBuilders
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
    survey = await new SurveyBuilder(
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
      attributeIId: clusterIdAttr.iId,
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

  test('fixCodeAttribute: missing hierarchical code node inserted with correct hCode', async () => {
    const categoryName = 'admin_unit'

    const surveyWithCode = await new SurveyBuilder(
      user,
      entityDef(
        'root',
        integerDef('id').key(),
        codeDef('region', categoryName),
        codeDef('province', categoryName).parentCodeAttribute('region')
      )
    )
      .categories(
        category(categoryName)
          .levels('level_1', 'level_2')
          .items(categoryItem('1').items(categoryItem('1a'), categoryItem('1b')))
      )
      .build()

    // Build record - province node will have hCode populated by attributeBuilder
    const province1aItem = TestUtils.getCategoryItem({
      survey: surveyWithCode,
      categoryName,
      codePaths: ['1', '1a'],
    })
    const builtRecord = new RecordBuilder(
      user,
      surveyWithCode,
      entity(
        'root',
        attribute('id', 1),
        attribute('region', '1'),
        attribute('province', { itemUuid: province1aItem.uuid })
      )
    ).build()

    // Grab the region node uuid (the parent code attribute)
    const regionNode = TestUtils.getNodeByPath({ survey: surveyWithCode, record: builtRecord, path: 'root.region' })

    // Delete the province node properly (including index) so insertMissingSingleNodes will recreate it
    const provinceDef = Surveys.getNodeDefByName({ survey: surveyWithCode, name: 'province' })
    const [provinceNode] = Records.getNodesByDefUuid(provinceDef.uuid)(builtRecord)
    const { record: recordWithoutProvince } = Records.deleteNodes([provinceNode.iId])(builtRecord)

    const fixResult = RecordFixer.insertMissingSingleNodes({
      survey: surveyWithCode,
      record: recordWithoutProvince,
      sideEffect: false,
    })

    const [reinsertedProvince] = Records.getNodesByDefUuid(provinceDef.uuid)(fixResult.record)
    expect(reinsertedProvince).toBeDefined()
    expect(reinsertedProvince.meta?.hCode).toEqual([regionNode.iId])
  })

  describe('node internal id migration', () => {
    const recordUuid = 'record-uuid'
    const rootUuid = 'root-uuid'
    const childUuid = 'child-uuid'
    const grandchildUuid = 'grandchild-uuid'

    const buildLegacyRecord = (): any => ({
      uuid: recordUuid,
      nodes: {
        [rootUuid]: {
          uuid: rootUuid,
          recordUuid,
          nodeDefUuid: 'cluster-def-uuid',
          meta: { h: [] },
        },
        [childUuid]: {
          uuid: childUuid,
          parentUuid: rootUuid,
          recordUuid,
          nodeDefUuid: 'plot-def-uuid',
          meta: { h: [rootUuid] },
        },
        [grandchildUuid]: {
          uuid: grandchildUuid,
          parentUuid: childUuid,
          recordUuid,
          nodeDefUuid: 'tree-def-uuid',
          value: 10,
          meta: { h: [rootUuid, childUuid] },
        },
      },
    })

    test('isLegacyNodeFormat detects a uuid/parentUuid-linked record', () => {
      expect(RecordFixer.isLegacyNodeFormat(buildLegacyRecord())).toBe(true)
    })

    test('isLegacyNodeFormat returns false for a record with no nodes', () => {
      expect(RecordFixer.isLegacyNodeFormat({ uuid: recordUuid, nodes: {} })).toBe(false)
    })

    test('isLegacyNodeFormat returns false once nodes are iId/pIId-linked', () => {
      const legacyRecord = buildLegacyRecord()
      const migratedRecord = RecordFixer.initInternalIds({
        record: legacyRecord,
        nodes: Object.values(legacyRecord.nodes),
      })
      expect(RecordFixer.isLegacyNodeFormat(migratedRecord)).toBe(false)
    })

    test('initInternalIds reassigns node identity and preserves the tree shape, regardless of input order', () => {
      const legacyRecord = buildLegacyRecord()
      // pass nodes out of hierarchy order (grandchild before child before root): initInternalIds
      // must sort them itself rather than relying on the caller to do so
      const unorderedNodes = Object.values(legacyRecord.nodes).reverse() as any[]

      const migrated = RecordFixer.initInternalIds({ record: legacyRecord, nodes: unorderedNodes })
      const nodesByIId = migrated.nodes as any
      const migratedNodes = Object.values(nodesByIId) as any[]

      expect(migratedNodes).toHaveLength(3)
      expect(migrated.lastNodeInternalId).toBe(3)

      const root = migratedNodes.find((node) => node.nodeDefUuid === 'cluster-def-uuid')
      const child = migratedNodes.find((node) => node.nodeDefUuid === 'plot-def-uuid')
      const grandchild = migratedNodes.find((node) => node.nodeDefUuid === 'tree-def-uuid')

      // uuid-based linkage is gone
      ;[root, child, grandchild].forEach((node) => {
        expect(node.uuid).toBeUndefined()
        expect(node.parentUuid).toBeUndefined()
      })

      // iId-based linkage is consistent
      expect(root.pIId).toBeUndefined()
      expect(child.pIId).toBe(root.iId)
      expect(grandchild.pIId).toBe(child.iId)

      // hierarchy meta remapped from ancestor uuids to ancestor iIds (root's empty hierarchy is dropped)
      expect(root.meta?.h).toBeUndefined()
      expect(child.meta.h).toEqual([root.iId])
      expect(grandchild.meta.h).toEqual([root.iId, child.iId])

      // nodes are stored keyed by their own iId
      expect(nodesByIId[root.iId]).toBe(root)
      expect(nodesByIId[child.iId]).toBe(child)
      expect(nodesByIId[grandchild.iId]).toBe(grandchild)

      // unrelated node data is untouched
      expect(grandchild.value).toBe(10)
      expect(migrated.uuid).toBe(recordUuid)
    })
  })
})
