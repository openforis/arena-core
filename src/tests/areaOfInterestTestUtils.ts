import { ArenaAreaOfInterest } from '../geo'
import { ArenaAreaOfInterestProvider } from '../nodeDefExpressionEvaluator'
import { ArenaSurvey } from '../survey'

/**
 * Provider returning the specified geometries, by area name.
 */
export const createTestAreaOfInterestProvider = (
  geometriesByName: Record<string, ArenaAreaOfInterest>
): ArenaAreaOfInterestProvider => ({
  getAreaOfInterest: ({ name }) => Promise.resolve(geometriesByName[name]),
})

/**
 * Survey with the descriptors of the specified areas of interest (in the specified order).
 */
export const withAreasOfInterest = (survey: ArenaSurvey, names: string[]): ArenaSurvey => ({
  ...survey,
  props: {
    ...survey.props,
    areasOfInterest: names.map((name) => ({
      name,
      fileUuid: `${name}-file`,
      fileName: `${name}.geojson`,
      size: 100,
      polygons: 1,
      vertices: 5,
    })),
  },
})
