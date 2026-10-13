import { beforeAll, describe, expect, test } from '@jest/globals'

import { Survey, Surveys } from '../survey'
import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { createTestAdminUser } from '../tests/data'
import { NodeDefExpressionEvaluator } from './evaluator'

const { entityDef, integerDef } = SurveyObjectBuilders

const user = createTestAdminUser()
let survey: Survey

const findReferencedNames = async (expression: string): Promise<(string | undefined)[]> => {
  const nodeDef = Surveys.getNodeDefByName({ survey, name: 'plot_calc' })
  const uuids = await new NodeDefExpressionEvaluator().findReferencedNodeDefUuids({ expression, user, survey, nodeDef })
  return [...uuids].map((uuid) => Surveys.getNodeDefByUuid({ survey, uuid }).props.name).sort()
}

describe('NodeDefExpressionEvaluator.findReferencedNodeDefUuids', () => {
  beforeAll(async () => {
    survey = await new SurveyBuilder(
      user,
      entityDef('cluster', integerDef('cluster_id').key(), integerDef('plot_id'), integerDef('plot_calc'))
    ).build()
  }, 10000)

  test('valid expression', async () => {
    expect(await findReferencedNames('cluster_id + plot_id')).toEqual(['cluster_id', 'plot_id'])
  })

  test('evaluation error: the node defs referenced before the error are kept', async () => {
    expect(await findReferencedNames('cluster_id + not_existing_attribute')).toEqual(['cluster_id'])
  })
})
