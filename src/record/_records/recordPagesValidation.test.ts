import { describe, test, expect } from '@jest/globals'

import { NodeDefEntity } from '../../nodeDef'
import { Records } from '../records'
import { Surveys } from '../../survey'
import { SurveyBuilder, SurveyObjectBuilders } from '../../tests/builder/surveyBuilder'
import { RecordBuilder, RecordNodeBuilders } from '../../tests/builder/recordBuilder'
import { createTestAdminUser } from '../../tests/data'
import { Objects, UUIDs } from '../../utils'
import { ValidationFactory, ValidationResultFactory, ValidationSeverity } from '../../validation'

const { entityDef, integerDef, textDef } = SurveyObjectBuilders
const { attribute, entity } = RecordNodeBuilders

const cycle = '0'

const setOwnPage = (pageNodeDef: NodeDefEntity, parentNodeDef: NodeDefEntity): void => {
  const pageUuid = UUIDs.v4()
  Objects.setInPath({ obj: pageNodeDef, path: ['props', 'layout', cycle, 'pageUuid'], value: pageUuid })
  const indexChildren =
    (Objects.path(['props', 'layout', cycle, 'indexChildren'])(parentNodeDef) as string[] | undefined) ?? []
  Objects.setInPath({
    obj: parentNodeDef,
    path: ['props', 'layout', cycle, 'indexChildren'],
    value: [...indexChildren, pageNodeDef.uuid],
  })
}

describe('RecordPagesValidationProgress', () => {
  test('single root page with no errors is 100% valid', async () => {
    const user = createTestAdminUser()
    const survey = await new SurveyBuilder(
      user,
      entityDef('cluster', integerDef('cluster_id').key(), textDef('remarks'))
    ).build()

    const record = new RecordBuilder(
      user,
      survey,
      entity('cluster', attribute('cluster_id', 10), attribute('remarks', null))
    ).build()

    expect(Records.getRecordPagesValidationProgress({ survey, record, cycle })).toEqual({
      percent: 100,
      validCount: 1,
      totalCount: 1,
    })
  })

  test('own-page error reduces valid page count; nested page errors do not affect parent', async () => {
    const user = createTestAdminUser()
    const survey = await new SurveyBuilder(
      user,
      entityDef(
        'cluster',
        integerDef('cluster_id').key(),
        entityDef('plot', integerDef('plot_id').key()).multiple()
      )
    ).build()

    const rootDef = Surveys.getNodeDefRoot({ survey }) as NodeDefEntity
    const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' }) as NodeDefEntity
    setOwnPage(plotDef, rootDef)

    expect(Records.getPageNodeDefs({ survey, cycle }).map((d) => d.props.name)).toEqual(['cluster', 'plot'])

    const record = new RecordBuilder(
      user,
      survey,
      entity(
        'cluster',
        attribute('cluster_id', 10),
        entity('plot', attribute('plot_id', 1)),
        entity('plot', attribute('plot_id', 2))
      )
    ).build()

    const clusterIdNode = Records.getNodesByDefUuid(
      Surveys.getNodeDefByName({ survey, name: 'cluster_id' }).uuid
    )(record)[0]
    const plotIdNodes = Records.getNodesByDefUuid(Surveys.getNodeDefByName({ survey, name: 'plot_id' }).uuid)(record)

    // Error only on nested plot field → parent cluster stays valid; 1 of 2 pages invalid.
    record.validation = ValidationFactory.createInstance({
      valid: false,
      fields: {
        [plotIdNodes[0].uuid]: ValidationFactory.createInstance({
          valid: false,
          errors: [ValidationResultFactory.createInstance({ key: 'invalid', severity: ValidationSeverity.error })],
        }),
      },
    })

    expect(Records.getRecordPagesValidationProgress({ survey, record, cycle })).toEqual({
      percent: 50,
      validCount: 1,
      totalCount: 2,
    })

    // Error on root field as well → both pages invalid when nested still has error.
    record.validation = ValidationFactory.createInstance({
      valid: false,
      fields: {
        [clusterIdNode.uuid]: ValidationFactory.createInstance({
          valid: false,
          errors: [ValidationResultFactory.createInstance({ key: 'invalid', severity: ValidationSeverity.error })],
        }),
        [plotIdNodes[0].uuid]: ValidationFactory.createInstance({
          valid: false,
          errors: [ValidationResultFactory.createInstance({ key: 'invalid', severity: ValidationSeverity.error })],
        }),
      },
    })

    expect(Records.getRecordPagesValidationProgress({ survey, record, cycle })).toEqual({
      percent: 0,
      validCount: 0,
      totalCount: 2,
    })
  })

  test('warnings alone do not reduce pages validation progress', async () => {
    const user = createTestAdminUser()
    const survey = await new SurveyBuilder(
      user,
      entityDef('cluster', integerDef('cluster_id').key(), textDef('remarks'))
    ).build()

    const record = new RecordBuilder(
      user,
      survey,
      entity('cluster', attribute('cluster_id', 10), attribute('remarks', 'note'))
    ).build()

    const remarksNode = Records.getNodesByDefUuid(Surveys.getNodeDefByName({ survey, name: 'remarks' }).uuid)(record)[0]
    record.validation = ValidationFactory.createInstance({
      valid: true,
      fields: {
        [remarksNode.uuid]: ValidationFactory.createInstance({
          valid: true,
          warnings: [ValidationResultFactory.createInstance({ key: 'warn', severity: ValidationSeverity.warning })],
        }),
      },
    })

    expect(Records.getRecordPagesValidationProgress({ survey, record, cycle })).toEqual({
      percent: 100,
      validCount: 1,
      totalCount: 1,
    })

    expect(
      Records.getPageValidationStatus({
        pageNodeDefUuid: Surveys.getNodeDefRoot({ survey }).uuid,
        record,
      })
    ).toEqual({ hasErrors: false, hasWarnings: true })
  })

  test('getPageValidationStatus scopes to own page when descendant pages are provided', async () => {
    const user = createTestAdminUser()
    const survey = await new SurveyBuilder(
      user,
      entityDef(
        'cluster',
        integerDef('cluster_id').key(),
        entityDef('plot', integerDef('plot_id').key()).multiple()
      )
    ).build()

    const rootDef = Surveys.getNodeDefRoot({ survey }) as NodeDefEntity
    const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' }) as NodeDefEntity
    setOwnPage(plotDef, rootDef)

    const record = new RecordBuilder(
      user,
      survey,
      entity('cluster', attribute('cluster_id', 10), entity('plot', attribute('plot_id', 1)))
    ).build()

    const plotIdNode = Records.getNodesByDefUuid(Surveys.getNodeDefByName({ survey, name: 'plot_id' }).uuid)(record)[0]
    record.validation = ValidationFactory.createInstance({
      valid: false,
      fields: {
        [plotIdNode.uuid]: ValidationFactory.createInstance({
          valid: false,
          errors: [ValidationResultFactory.createInstance({ key: 'invalid', severity: ValidationSeverity.error })],
        }),
      },
    })

    const descendantPageUuids = Records.getDescendantPageNodeDefUuids({ survey, cycle, pageNodeDef: rootDef })
    expect(descendantPageUuids).toEqual([plotDef.uuid])

    expect(
      Records.getPageValidationStatus({
        pageNodeDefUuid: rootDef.uuid,
        descendantPageUuids,
        record,
      })
    ).toEqual({ hasErrors: false, hasWarnings: false })

    expect(
      Records.getPageValidationStatus({
        pageNodeDefUuid: plotDef.uuid,
        descendantPageUuids: [],
        record,
      })
    ).toEqual({ hasErrors: true, hasWarnings: false })
  })

  test('childrenCount validation keys do not affect page validation progress', async () => {
    const user = createTestAdminUser()
    const survey = await new SurveyBuilder(
      user,
      entityDef('cluster', integerDef('cluster_id').key(), entityDef('plot', integerDef('plot_id').key()).multiple())
    ).build()

    const rootDef = Surveys.getNodeDefRoot({ survey }) as NodeDefEntity
    const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' }) as NodeDefEntity
    setOwnPage(plotDef, rootDef)

    const record = new RecordBuilder(
      user,
      survey,
      entity('cluster', attribute('cluster_id', 10), entity('plot', attribute('plot_id', 1)))
    ).build()

    const clusterNode = Records.getRoot(record)!
    const childrenCountKey = `childrenCount_${clusterNode.uuid}_${plotDef.uuid}`
    record.validation = ValidationFactory.createInstance({
      valid: false,
      fields: {
        [childrenCountKey]: ValidationFactory.createInstance({
          valid: false,
          errors: [ValidationResultFactory.createInstance({ key: 'record.nodes.count.min', severity: ValidationSeverity.error })],
        }),
      },
    })

    expect(Records.getRecordPagesValidationProgress({ survey, record, cycle })).toEqual({
      percent: 100,
      validCount: 2,
      totalCount: 2,
    })
  })

  test('three-level own pages: middle page stays valid when only leaf has errors', async () => {
    const user = createTestAdminUser()
    const survey = await new SurveyBuilder(
      user,
      entityDef(
        'cluster',
        integerDef('cluster_id').key(),
        entityDef(
          'plot',
          integerDef('plot_id').key(),
          entityDef('tree', integerDef('tree_id').key()).multiple()
        ).multiple()
      )
    ).build()

    const rootDef = Surveys.getNodeDefRoot({ survey }) as NodeDefEntity
    const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' }) as NodeDefEntity
    const treeDef = Surveys.getNodeDefByName({ survey, name: 'tree' }) as NodeDefEntity
    setOwnPage(plotDef, rootDef)
    setOwnPage(treeDef, plotDef)

    expect(Records.getPageNodeDefs({ survey, cycle }).map((d) => d.props.name).sort()).toEqual([
      'cluster',
      'plot',
      'tree',
    ])

    const record = new RecordBuilder(
      user,
      survey,
      entity(
        'cluster',
        attribute('cluster_id', 10),
        entity('plot', attribute('plot_id', 1), entity('tree', attribute('tree_id', 1)))
      )
    ).build()

    const treeIdNode = Records.getNodesByDefUuid(Surveys.getNodeDefByName({ survey, name: 'tree_id' }).uuid)(record)[0]
    record.validation = ValidationFactory.createInstance({
      valid: false,
      fields: {
        [treeIdNode.uuid]: ValidationFactory.createInstance({
          valid: false,
          errors: [ValidationResultFactory.createInstance({ key: 'invalid', severity: ValidationSeverity.error })],
        }),
      },
    })

    // cluster + plot valid, tree invalid => 2/3
    expect(Records.getRecordPagesValidationProgress({ survey, record, cycle })).toEqual({
      percent: 67,
      validCount: 2,
      totalCount: 3,
    })
  })

  test('nested entity without own page counts toward parent page validation', async () => {
    const user = createTestAdminUser()
    const survey = await new SurveyBuilder(
      user,
      entityDef(
        'cluster',
        integerDef('cluster_id').key(),
        entityDef('plot_inline', integerDef('plot_id').key()).multiple()
      )
    ).build()

    // plot_inline stays on parent page (no pageUuid)
    expect(Records.getPageNodeDefs({ survey, cycle }).map((d) => d.props.name)).toEqual(['cluster'])

    const record = new RecordBuilder(
      user,
      survey,
      entity('cluster', attribute('cluster_id', 10), entity('plot_inline', attribute('plot_id', 1)))
    ).build()

    const plotIdNode = Records.getNodesByDefUuid(Surveys.getNodeDefByName({ survey, name: 'plot_id' }).uuid)(record)[0]
    record.validation = ValidationFactory.createInstance({
      valid: false,
      fields: {
        [plotIdNode.uuid]: ValidationFactory.createInstance({
          valid: false,
          errors: [ValidationResultFactory.createInstance({ key: 'invalid', severity: ValidationSeverity.error })],
        }),
      },
    })

    expect(Records.getRecordPagesValidationProgress({ survey, record, cycle })).toEqual({
      percent: 0,
      validCount: 0,
      totalCount: 1,
    })
  })
})
