import { describe, test, expect, beforeAll, jest } from '@jest/globals'

import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { RecordBuilder, RecordNodeBuilders } from '../tests/builder/recordBuilder'
import { createTestAdminUser } from '../tests/data'
import { TestUtils } from '../tests/testUtils'

import { User } from '../auth'
import { JavascriptExpressionEvaluator } from '../expression'
import { Survey, Surveys } from '../survey'
import { Record } from './record'
import { RecordUpdater } from './recordUpdater'
import { RecordUpdateResult } from './recordNodesUpdater'

const { entityDef, integerDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

/**
 * Guards against record updates becoming non linear with the record size.
 * The work is measured as the number of evaluations of every expression (deterministic, unlike wall-clock time):
 * - expressions depending only on nodes in the same entity (or in its ancestors) must be evaluated the same
 *   number of times in a small and in a big record;
 * - expressions referencing the same attribute in other entities must be evaluated at most once per instance of
 *   that attribute (linear, never quadratic).
 */

const PLOTS = 3
const TREES_PER_PLOT_SMALL = 5
const TREES_PER_PLOT_BIG = 50

// validation of every coverage depending on the coverage of the sibling trees
const SIBLINGS_EXPRESSION = 'sum(parent($context).tree.coverage) <= 100'

let user: User
let survey: Survey

const createSurvey = (): Promise<Survey> =>
  new SurveyBuilder(
    user,
    entityDef(
      'cluster',
      integerDef('cluster_id').key(),
      entityDef(
        'plot',
        integerDef('plot_id').key(),
        // aggregates of the trees in the same plot
        integerDef('plot_dbh_sum').readOnly().defaultValue('sum(tree.dbh)'),
        integerDef('plot_trees_count').readOnly().defaultValue('count(tree)'),
        entityDef(
          'tree',
          integerDef('tree_id').key(),
          // self reference (resolved in the same tree)
          integerDef('dbh').validationExpressions('dbh > 0 && dbh < 1000', 'dbh != 999'),
          integerDef('height').applyIf('dbh > 10').validationExpressions('height > dbh / 10'),
          // chain of calculated attributes
          integerDef('dbh_double').readOnly().defaultValue('dbh * 2'),
          integerDef('dbh_double_plus_one').readOnly().defaultValue('dbh_double + 1'),
          integerDef('coverage').validationExpressions(SIBLINGS_EXPRESSION),
          integerDef('notes')
        ).multiple()
      ).multiple()
    )
  ).build()

const createRecord = (treesPerPlot: number): Record =>
  new RecordBuilder(
    user,
    survey,
    entity(
      'cluster',
      attribute('cluster_id', 1),
      ...Array.from({ length: PLOTS }, (_p, plotIndex) =>
        entity(
          'plot',
          attribute('plot_id', plotIndex + 1),
          attribute('plot_dbh_sum'),
          attribute('plot_trees_count'),
          ...Array.from({ length: treesPerPlot }, (_t, treeIndex) =>
            entity(
              'tree',
              attribute('tree_id', treeIndex + 1),
              attribute('dbh', 20),
              attribute('height', 5),
              attribute('dbh_double'),
              attribute('dbh_double_plus_one'),
              attribute('coverage', 1),
              attribute('notes')
            )
          )
        )
      )
    )
  ).build()

type EvaluationsByExpression = { [expression: string]: number }

// every record expression is evaluated through JavascriptExpressionEvaluator.evaluate
const countEvaluations = async (update: () => Promise<RecordUpdateResult>): Promise<EvaluationsByExpression> => {
  const evaluateSpy = jest.spyOn(JavascriptExpressionEvaluator.prototype, 'evaluate')
  try {
    await update()
    const evaluationsByExpression: EvaluationsByExpression = {}
    for (const [expression] of evaluateSpy.mock.calls) {
      evaluationsByExpression[expression] = (evaluationsByExpression[expression] ?? 0) + 1
    }
    return evaluationsByExpression
  } finally {
    evaluateSpy.mockRestore()
  }
}

const withoutSiblingsExpression = (evaluations: EvaluationsByExpression): EvaluationsByExpression => {
  const { [SIBLINGS_EXPRESSION]: _siblingsEvaluations, ...otherEvaluations } = evaluations
  return otherEvaluations
}

const expectScalableUpdate = async (params: {
  update: (record: Record) => Promise<RecordUpdateResult>
  expectedExpressions: string[]
}) => {
  const { update, expectedExpressions } = params
  const small = await countEvaluations(() => update(createRecord(TREES_PER_PLOT_SMALL)))
  const big = await countEvaluations(() => update(createRecord(TREES_PER_PLOT_BIG)))

  // the expected dependents are evaluated (otherwise the test would not prove anything)
  expect(Object.keys(small).sort()).toEqual([...expectedExpressions].sort())
  // same work for the expressions not referencing other entities
  expect(withoutSiblingsExpression(big)).toEqual(withoutSiblingsExpression(small))
  // at most one evaluation per coverage attribute in the record
  expect(big[SIBLINGS_EXPRESSION] ?? 0).toBeLessThanOrEqual(PLOTS * TREES_PER_PLOT_BIG + 1)
}

const updateAttribute =
  (path: string, value: any) =>
  (record: Record): Promise<RecordUpdateResult> => {
    const node = TestUtils.getNodeByPath({ survey, record, path })
    return RecordUpdater.updateAttributeValue({ user, survey, record, attributeUuid: node.uuid, value })
  }

describe('RecordUpdater - scalability: the work done by an update does not grow non linearly with the record size', () => {
  beforeAll(async () => {
    user = createTestAdminUser()
    survey = await createSurvey()
  }, 10000)

  test('attribute with dependents in the same entity (self reference validation, calculated attributes, applicability)', async () => {
    await expectScalableUpdate({
      update: updateAttribute('plot[1].tree[2].dbh', 30),
      expectedExpressions: [
        'dbh > 0 && dbh < 1000',
        'dbh != 999',
        'dbh > 10',
        'height > dbh / 10',
        'dbh * 2',
        'dbh_double + 1',
        'sum(tree.dbh)',
      ],
    })
  })

  test('attribute without dependents', async () => {
    const evaluations = await countEvaluations(() =>
      updateAttribute('plot[1].tree[2].notes', 5)(createRecord(TREES_PER_PLOT_BIG))
    )
    expect(evaluations).toEqual({})
  })

  test('attribute referenced by the same attribute in the sibling entities', async () => {
    await expectScalableUpdate({
      update: updateAttribute('plot[1].tree[2].coverage', 2),
      expectedExpressions: [SIBLINGS_EXPRESSION],
    })
  })

  test('new entity', async () => {
    const treeDef = Surveys.getNodeDefByName({ survey, name: 'tree' })
    await expectScalableUpdate({
      update: (record) => {
        const plot = TestUtils.getNodeByPath({ survey, record, path: 'plot[1]' })
        return RecordUpdater.createNodeAndDescendants({ user, survey, record, parentNode: plot, nodeDef: treeDef })
      },
      expectedExpressions: [
        'sum(tree.dbh)',
        'count(tree)',
        'dbh > 10',
        'dbh * 2',
        'dbh_double + 1',
        SIBLINGS_EXPRESSION,
      ],
    })
  })

  test('entity deletion', async () => {
    await expectScalableUpdate({
      update: (record) => {
        const tree = TestUtils.getNodeByPath({ survey, record, path: 'plot[1].tree[2]' })
        return RecordUpdater.deleteNode({ user, survey, record, nodeUuid: tree.uuid })
      },
      expectedExpressions: ['sum(tree.dbh)', 'count(tree)', SIBLINGS_EXPRESSION],
    })
  })
})
