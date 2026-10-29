import { describe, test, expect } from '@jest/globals'

import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { RecordBuilder, RecordNodeBuilders } from '../tests/builder/recordBuilder'
import { createTestAreaOfInterestProvider, withAreasOfInterest } from '../tests/areaOfInterestTestUtils'
import { createTestAdminUser } from '../tests/data'
import { TestUtils } from '../tests/testUtils'
import { Validations } from '../validation'
import { RecordUpdater } from './recordUpdater'

const { coordinateDef, entityDef, integerDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

const user = createTestAdminUser()

const areaOfInterestProvider = createTestAreaOfInterestProvider({
  pilot: {
    type: 'Polygon',
    coordinates: [
      [
        [12, 41],
        [13, 41],
        [13, 42],
        [12, 42],
        [12, 41],
      ],
    ],
  },
})

describe('RecordUpdater - validations using areas of interest', () => {
  test('the area of interest provider is used to validate the updated attributes', async () => {
    const surveyBuilt = await new SurveyBuilder(
      user,
      entityDef(
        'root_entity',
        integerDef('identifier').key(),
        coordinateDef('location').validationExpressions(`geoAOIContaining(this) == 'pilot'`)
      )
    ).build()
    const survey = withAreasOfInterest(surveyBuilt, ['pilot'])

    const record = new RecordBuilder(
      user,
      survey,
      entity('root_entity', attribute('identifier', 1), attribute('location', null))
    ).build()
    const location = TestUtils.getNodeByPath({ survey, record, path: 'location' })

    const isValidAfterUpdate = async (x: number, y: number): Promise<boolean> => {
      const { record: recordUpdated } = await RecordUpdater.updateAttributeValue({
        user,
        survey,
        record,
        areaOfInterestProvider,
        attributeUuid: location.uuid,
        value: { x, y, srs: '4326' },
      })
      return Validations.isValid(Validations.getValidation(recordUpdated))
    }
    expect(await isValidAfterUpdate(12.5, 41.5)).toBe(true)
    expect(await isValidAfterUpdate(14, 41.5)).toBe(false)
  })
})
