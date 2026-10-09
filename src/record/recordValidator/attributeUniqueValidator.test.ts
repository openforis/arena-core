import { describe, test, expect, beforeAll } from '@jest/globals'

import { Survey, Surveys } from '../../survey'
import { RecordBuilder, RecordNodeBuilders } from '../../tests/builder/recordBuilder'
import { SurveyBuilder, SurveyObjectBuilders } from '../../tests/builder/surveyBuilder'
import { createTestAdminUser } from '../../tests/data'
import { TestUtils } from '../../tests/testUtils'
import { AttributeUniqueValidator } from './attributeUniqueValidator'

const { entityDef, integerDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

const user = createTestAdminUser()
let survey: Survey

const validatePlotNum = async (plotNumValues: (number | null)[]) => {
  const record = new RecordBuilder(
    user,
    survey,
    entity(
      'cluster',
      attribute('cluster_id', 1),
      ...plotNumValues.map((value) => entity('plot', attribute('plot_num', value)))
    )
  ).build()
  const nodeDef = Surveys.getNodeDefByName({ survey, name: 'plot_num' })
  const node = TestUtils.getNodeByPath({ survey, record, path: 'cluster.plot[0].plot_num' })
  return AttributeUniqueValidator.validateAttributeUnique({ survey, record, nodeDef })('value', node)
}

describe('AttributeUniqueValidator', () => {
  beforeAll(async () => {
    survey = await new SurveyBuilder(
      user,
      entityDef('cluster', integerDef('cluster_id').key(), entityDef('plot', integerDef('plot_num')).multiple())
    ).build()
    const plotNumDef = Surveys.getNodeDefByName({ survey, name: 'plot_num' })
    plotNumDef.propsAdvanced = { ...plotNumDef.propsAdvanced, validations: { unique: true } }
  })

  test('duplicate values are not valid', async () => {
    const result = await validatePlotNum([1, 1])
    expect(result.valid).toBe(false)
    expect(result.key).toBe('record.attribute.uniqueDuplicate')
  })

  test('different values are valid', async () => {
    const result = await validatePlotNum([1, 2])
    expect(result.valid).toBe(true)
  })

  test('blank values are not considered duplicates', async () => {
    const result = await validatePlotNum([null, null])
    expect(result.valid).toBe(true)
  })
})
