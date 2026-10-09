import { beforeAll, describe, expect, test } from '@jest/globals'

import { Survey, Surveys } from '../survey'
import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { createTestAdminUser } from '../tests/data'
import { NodeDefExpressionEvaluator } from './evaluator'

const { entityDef, integerDef, textDef } = SurveyObjectBuilders

const user = createTestAdminUser()
let survey: Survey

// attributes named like properties of node def objects (type, uuid, props, meta) or of their JS value type
// (e.g. trim, concat for text attributes) must be resolved as references to those attributes
describe('NodeDefExpressionEvaluator: identifiers with the same name as native properties', () => {
  beforeAll(async () => {
    survey = await new SurveyBuilder(
      user,
      entityDef(
        'root',
        integerDef('id').key(),
        textDef('name'),
        integerDef('type'),
        integerDef('meta'),
        textDef('trim'),
        textDef('description')
      )
    ).build()
  })

  test.each(['name', 'type', 'meta', 'trim'])('%s is resolved as a reference to the attribute', async (attrName) => {
    const nodeDef = Surveys.getNodeDefByName({ survey, name: 'description' })
    const referencedDef = Surveys.getNodeDefByName({ survey, name: attrName })
    const referencedNodeDefUuids = await new NodeDefExpressionEvaluator().findReferencedNodeDefUuids({
      user,
      survey,
      nodeDef,
      expression: `${attrName} != null`,
    })
    expect([...referencedNodeDefUuids]).toEqual([referencedDef.uuid])
  })
})
