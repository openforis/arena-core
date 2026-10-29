import { beforeAll, describe, expect, test } from '@jest/globals'

import { Survey, Surveys } from '../survey'
import { withAreasOfInterest } from '../tests/areaOfInterestTestUtils'
import { createTestAdminUser, createTestSurvey } from '../tests/data'
import { NodeDefExpressionValidator } from './validator'

const user = createTestAdminUser()
let survey: Survey

const validate = (expression: string) =>
  new NodeDefExpressionValidator().validate({ expression, survey, nodeDefCurrent: Surveys.getNodeDefRoot({ survey }) })

describe('NodeDefExpressionValidator: areas of interest', () => {
  beforeAll(async () => {
    survey = withAreasOfInterest(await createTestSurvey({ user }), ['pilot_area'])
  }, 10000)

  test('existing area name => valid', async () => {
    const { validationResult } = await validate(`geoDistanceToAOIBoundary(cluster_location, 'pilot_area')`)
    expect(validationResult.valid).toBe(true)
  })

  test('geoAOIContaining => valid', async () => {
    const { validationResult } = await validate('geoAOIContaining(cluster_location)')
    expect(validationResult.valid).toBe(true)
  })

  test('unknown area name => error', async () => {
    const { validationResult } = await validate(`geoDistanceToAOIBoundary(cluster_location, 'other_area')`)
    expect(validationResult.valid).toBe(false)
    expect(validationResult.key).toBe('expression.areaOfInterestNotFound')
    expect(validationResult.params).toEqual({ name: 'other_area' })
  })
})
