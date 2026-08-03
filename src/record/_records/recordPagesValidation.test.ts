import { describe, test, expect } from '@jest/globals'

import { NodeDefEntity } from '../../nodeDef'
import { Records } from '../records'
import { RecordValidations } from '../recordValidations'
import { Surveys } from '../../survey'
import { SurveyBuilder, SurveyObjectBuilders } from '../../tests/builder/surveyBuilder'
import { RecordBuilder, RecordNodeBuilders } from '../../tests/builder/recordBuilder'
import { createTestAdminUser } from '../../tests/data'
import { Objects, UUIDs } from '../../utils'
import { ValidationFactory, ValidationResultFactory, ValidationSeverity } from '../../validation'

const { entityDef, fileDef, integerDef, textDef } = SurveyObjectBuilders
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

  test('childrenCount for descendant page entities does not affect parent page validation', async () => {
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

  test('childrenCount for file/attribute min count marks the parent page invalid', async () => {
    const user = createTestAdminUser()
    const survey = await new SurveyBuilder(
      user,
      entityDef('cluster', integerDef('cluster_id').key(), fileDef('attachment').multiple())
    ).build()

    const record = new RecordBuilder(
      user,
      survey,
      entity('cluster', attribute('cluster_id', 10))
    ).build()

    const clusterNode = Records.getRoot(record)!
    const attachmentDef = Surveys.getNodeDefByName({ survey, name: 'attachment' })
    const childrenCountKey = RecordValidations.getValidationChildrenCountKey({
      nodeParentUuid: clusterNode.uuid,
      nodeDefChildUuid: attachmentDef.uuid,
    })
    record.validation = ValidationFactory.createInstance({
      valid: false,
      fields: {
        [childrenCountKey]: ValidationFactory.createInstance({
          valid: false,
          errors: [
            ValidationResultFactory.createInstance({
              key: 'record.nodes.count.minNotReached',
              severity: ValidationSeverity.error,
            }),
          ],
        }),
      },
    })

    expect(
      Records.getPageValidationStatus({
        pageNodeDefUuid: Surveys.getNodeDefRoot({ survey }).uuid,
        descendantPageUuids: [],
        record,
      })
    ).toEqual({ hasErrors: true, hasWarnings: false })

    expect(Records.getRecordPagesValidationProgress({ survey, record, cycle })).toEqual({
      percent: 0,
      validCount: 0,
      totalCount: 1,
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

  test('getPageValidationStatus with scopeEntityUuid ignores sibling entity instances', async () => {
    const user = createTestAdminUser()
    const survey = await new SurveyBuilder(
      user,
      entityDef(
        'cluster',
        integerDef('cluster_id').key(),
        entityDef(
          'plot',
          integerDef('plot_id').key(),
          entityDef('land_use', textDef('land_use_code').required())
        ).multiple()
      )
    ).build()

    const rootDef = Surveys.getNodeDefRoot({ survey }) as NodeDefEntity
    const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' }) as NodeDefEntity
    const landUseDef = Surveys.getNodeDefByName({ survey, name: 'land_use' }) as NodeDefEntity
    setOwnPage(plotDef, rootDef)
    setOwnPage(landUseDef, plotDef)

    const record = new RecordBuilder(
      user,
      survey,
      entity(
        'cluster',
        attribute('cluster_id', 10),
        entity('plot', attribute('plot_id', 3), entity('land_use', attribute('land_use_code', null))),
        entity('plot', attribute('plot_id', 4), entity('land_use', attribute('land_use_code', 'crop')))
      )
    ).build()

    const landUseCodeDefUuid = Surveys.getNodeDefByName({ survey, name: 'land_use_code' }).uuid
    const plotIdDefUuid = Surveys.getNodeDefByName({ survey, name: 'plot_id' }).uuid
    const findPlotEntityByPlotId = (plotId: number) => {
      const plotIdNode = Records.getNodesByDefUuid(plotIdDefUuid)(record).find((n) => n.value === plotId)
      return Records.getParent(plotIdNode!)(record)!
    }
    const plot3 = findPlotEntityByPlotId(3)
    const plot4 = findPlotEntityByPlotId(4)

    const plot3LandUse = Records.getChildren(plot3, landUseDef.uuid)(record)[0]
    const plot3Code = Records.getChildren(plot3LandUse, landUseCodeDefUuid)(record)[0]
    record.validation = ValidationFactory.createInstance({
      valid: false,
      fields: {
        [plot3Code.uuid]: ValidationFactory.createInstance({
          valid: false,
          errors: [ValidationResultFactory.createInstance({ key: 'required', severity: ValidationSeverity.error })],
        }),
      },
    })

    const landUseDescendants: string[] = []

    expect(
      Records.getPageValidationStatus({
        pageNodeDefUuid: landUseDef.uuid,
        descendantPageUuids: landUseDescendants,
        record,
      })
    ).toEqual({ hasErrors: true, hasWarnings: false })

    expect(
      Records.getPageValidationStatus({
        pageNodeDefUuid: landUseDef.uuid,
        descendantPageUuids: landUseDescendants,
        record,
        scopeEntityUuid: plot3.uuid,
      })
    ).toEqual({ hasErrors: true, hasWarnings: false })

    expect(
      Records.getPageValidationStatus({
        pageNodeDefUuid: landUseDef.uuid,
        descendantPageUuids: landUseDescendants,
        record,
        scopeEntityUuid: plot4.uuid,
      })
    ).toEqual({ hasErrors: false, hasWarnings: false })
  })

  test('getEntitySubtreeStatus reflects only that instance subtree', async () => {
    const user = createTestAdminUser()
    const survey = await new SurveyBuilder(
      user,
      entityDef(
        'cluster',
        integerDef('cluster_id').key(),
        entityDef(
          'plot',
          integerDef('plot_id').key(),
          entityDef('land_use', textDef('land_use_code').required())
        ).multiple()
      )
    ).build()

    const rootDef = Surveys.getNodeDefRoot({ survey }) as NodeDefEntity
    const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' }) as NodeDefEntity
    const landUseDef = Surveys.getNodeDefByName({ survey, name: 'land_use' }) as NodeDefEntity
    setOwnPage(plotDef, rootDef)
    setOwnPage(landUseDef, plotDef)

    const record = new RecordBuilder(
      user,
      survey,
      entity(
        'cluster',
        attribute('cluster_id', 10),
        entity('plot', attribute('plot_id', 3), entity('land_use', attribute('land_use_code', null))),
        entity('plot', attribute('plot_id', 4), entity('land_use', attribute('land_use_code', 'crop')))
      )
    ).build()

    const plotIdDefUuid = Surveys.getNodeDefByName({ survey, name: 'plot_id' }).uuid
    const landUseCodeDefUuid = Surveys.getNodeDefByName({ survey, name: 'land_use_code' }).uuid
    const findPlotEntityByPlotId = (plotId: number) => {
      const plotIdNode = Records.getNodesByDefUuid(plotIdDefUuid)(record).find((n) => n.value === plotId)
      return Records.getParent(plotIdNode!)(record)!
    }
    const plot3 = findPlotEntityByPlotId(3)
    const plot4 = findPlotEntityByPlotId(4)

    const plot3LandUse = Records.getChildren(plot3, landUseDef.uuid)(record)[0]
    const plot3Code = Records.getChildren(plot3LandUse, landUseCodeDefUuid)(record)[0]
    record.validation = ValidationFactory.createInstance({
      valid: false,
      fields: {
        [plot3Code.uuid]: ValidationFactory.createInstance({
          valid: false,
          errors: [ValidationResultFactory.createInstance({ key: 'required', severity: ValidationSeverity.error })],
        }),
      },
    })

    expect(Records.getEntitySubtreeStatus({ survey, record, entityUuid: plot3.uuid, cycle })).toEqual({
      hasErrors: true,
      hasWarnings: false,
      isComplete: false,
    })

    expect(Records.getEntitySubtreeStatus({ survey, record, entityUuid: plot4.uuid, cycle })).toEqual({
      hasErrors: false,
      hasWarnings: false,
      isComplete: true,
    })

    expect(Records.getEntitySubtreeStatus({ survey, record, entityUuid: 'missing-uuid', cycle })).toBeNull()
  })

  test('getEntitySubtreeStatus does not treat vacuous 100% completion as complete', async () => {
    const user = createTestAdminUser()
    const survey = await new SurveyBuilder(
      user,
      entityDef(
        'cluster',
        integerDef('cluster_id').key(),
        entityDef('plot', textDef('remarks')).multiple()
      )
    ).build()

    const rootDef = Surveys.getNodeDefRoot({ survey }) as NodeDefEntity
    const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' }) as NodeDefEntity
    setOwnPage(plotDef, rootDef)

    const record = new RecordBuilder(
      user,
      survey,
      entity('cluster', attribute('cluster_id', 10), entity('plot', attribute('remarks', null)))
    ).build()

    const plotEntity = Records.getChildren(
      Records.getRoot(record)!,
      plotDef.uuid
    )(record)[0]

    expect(Records.getEntityCompletionPercent({ survey, record, entity: plotEntity })).toBe(100)
    expect(Records.getEntityCompletionStats({ survey, record, entity: plotEntity })).toEqual({
      total: 0,
      filled: 0,
    })

    expect(Records.getEntitySubtreeStatus({ survey, record, entityUuid: plotEntity.uuid, cycle })).toEqual({
      hasErrors: false,
      hasWarnings: false,
      isComplete: false,
    })
  })

  test('getEntitySubtreeStatus returns null for non-entity nodes', async () => {
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

    const clusterIdNode = Records.getNodesByDefUuid(
      Surveys.getNodeDefByName({ survey, name: 'cluster_id' }).uuid
    )(record)[0]

    expect(Records.getEntitySubtreeStatus({ survey, record, entityUuid: clusterIdNode.uuid, cycle })).toBeNull()
  })

  test('getMultiplePageEntitiesStatus ORs errors across instances; complete only if all complete', async () => {
    const user = createTestAdminUser()
    const survey = await new SurveyBuilder(
      user,
      entityDef(
        'cluster',
        integerDef('cluster_id').key(),
        entityDef(
          'plot',
          integerDef('plot_id').key(),
          entityDef('land_use', textDef('land_use_code').required())
        ).multiple()
      )
    ).build()

    const rootDef = Surveys.getNodeDefRoot({ survey }) as NodeDefEntity
    const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' }) as NodeDefEntity
    const landUseDef = Surveys.getNodeDefByName({ survey, name: 'land_use' }) as NodeDefEntity
    setOwnPage(plotDef, rootDef)
    setOwnPage(landUseDef, plotDef)

    const record = new RecordBuilder(
      user,
      survey,
      entity(
        'cluster',
        attribute('cluster_id', 10),
        entity('plot', attribute('plot_id', 3), entity('land_use', attribute('land_use_code', null))),
        entity('plot', attribute('plot_id', 4), entity('land_use', attribute('land_use_code', 'crop')))
      )
    ).build()

    const plotIdDefUuid = Surveys.getNodeDefByName({ survey, name: 'plot_id' }).uuid
    const landUseCodeDefUuid = Surveys.getNodeDefByName({ survey, name: 'land_use_code' }).uuid
    const findPlotEntityByPlotId = (plotId: number) => {
      const plotIdNode = Records.getNodesByDefUuid(plotIdDefUuid)(record).find((n) => n.value === plotId)
      return Records.getParent(plotIdNode!)(record)!
    }
    const plot3 = findPlotEntityByPlotId(3)

    const plot3LandUse = Records.getChildren(plot3, landUseDef.uuid)(record)[0]
    const plot3Code = Records.getChildren(plot3LandUse, landUseCodeDefUuid)(record)[0]
    record.validation = ValidationFactory.createInstance({
      valid: false,
      fields: {
        [plot3Code.uuid]: ValidationFactory.createInstance({
          valid: false,
          errors: [ValidationResultFactory.createInstance({ key: 'required', severity: ValidationSeverity.error })],
        }),
      },
    })

    expect(Records.getMultiplePageEntitiesStatus({ survey, record, pageNodeDefUuid: plotDef.uuid, cycle })).toEqual({
      hasErrors: true,
      hasWarnings: false,
      isComplete: false,
    })

    plot3Code.value = 'crop'
    record.validation = ValidationFactory.createInstance({ valid: true, fields: {} })

    expect(Records.getMultiplePageEntitiesStatus({ survey, record, pageNodeDefUuid: plotDef.uuid, cycle })).toEqual({
      hasErrors: false,
      hasWarnings: false,
      isComplete: true,
    })

    const emptyRecord = new RecordBuilder(
      user,
      survey,
      entity('cluster', attribute('cluster_id', 10))
    ).build()

    expect(
      Records.getMultiplePageEntitiesStatus({ survey, record: emptyRecord, pageNodeDefUuid: plotDef.uuid, cycle })
    ).toEqual({
      hasErrors: false,
      hasWarnings: false,
      isComplete: false,
    })
  })

  test('getMultiplePageEntitiesStatus with scopeEntityUuid ignores nested instances under sibling parents', async () => {
    const user = createTestAdminUser()
    const survey = await new SurveyBuilder(
      user,
      entityDef(
        'cluster',
        integerDef('cluster_id').key(),
        entityDef(
          'plot',
          integerDef('plot_id').key(),
          entityDef('tree', integerDef('tree_id').key(), textDef('health').required()).multiple()
        ).multiple()
      )
    ).build()

    const rootDef = Surveys.getNodeDefRoot({ survey }) as NodeDefEntity
    const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' }) as NodeDefEntity
    const treeDef = Surveys.getNodeDefByName({ survey, name: 'tree' }) as NodeDefEntity
    setOwnPage(plotDef, rootDef)
    setOwnPage(treeDef, plotDef)

    const record = new RecordBuilder(
      user,
      survey,
      entity(
        'cluster',
        attribute('cluster_id', 10),
        entity(
          'plot',
          attribute('plot_id', 3),
          entity('tree', attribute('tree_id', 1), attribute('health', null))
        ),
        entity(
          'plot',
          attribute('plot_id', 4),
          entity('tree', attribute('tree_id', 2), attribute('health', 'ok'))
        )
      )
    ).build()

    const plotIdDefUuid = Surveys.getNodeDefByName({ survey, name: 'plot_id' }).uuid
    const healthDefUuid = Surveys.getNodeDefByName({ survey, name: 'health' }).uuid
    const findPlotEntityByPlotId = (plotId: number) => {
      const plotIdNode = Records.getNodesByDefUuid(plotIdDefUuid)(record).find((n) => n.value === plotId)
      return Records.getParent(plotIdNode!)(record)!
    }
    const plot3 = findPlotEntityByPlotId(3)
    const plot4 = findPlotEntityByPlotId(4)

    const plot3Tree = Records.getChildren(plot3, treeDef.uuid)(record)[0]
    const plot3Health = Records.getChildren(plot3Tree, healthDefUuid)(record)[0]
    record.validation = ValidationFactory.createInstance({
      valid: false,
      fields: {
        [plot3Health.uuid]: ValidationFactory.createInstance({
          valid: false,
          errors: [ValidationResultFactory.createInstance({ key: 'required', severity: ValidationSeverity.error })],
        }),
      },
    })

    // Unscoped: any tree in the record keeps Tree red.
    expect(
      Records.getMultiplePageEntitiesStatus({ survey, record, pageNodeDefUuid: treeDef.uuid, cycle })
    ).toEqual({
      hasErrors: true,
      hasWarnings: false,
      isComplete: false,
    })

    // Scoped to Plot 4: only Plot 4's trees — valid.
    expect(
      Records.getMultiplePageEntitiesStatus({
        survey,
        record,
        pageNodeDefUuid: treeDef.uuid,
        cycle,
        scopeEntityUuid: plot4.uuid,
      })
    ).toEqual({
      hasErrors: false,
      hasWarnings: false,
      isComplete: true,
    })

    // Scoped to Plot 3: only Plot 3's trees — invalid.
    expect(
      Records.getMultiplePageEntitiesStatus({
        survey,
        record,
        pageNodeDefUuid: treeDef.uuid,
        cycle,
        scopeEntityUuid: plot3.uuid,
      })
    ).toEqual({
      hasErrors: true,
      hasWarnings: false,
      isComplete: false,
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
