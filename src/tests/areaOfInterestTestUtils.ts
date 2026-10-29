import { AreaOfInterest } from '../geo'
import { AreaOfInterestProvider } from '../nodeDefExpressionEvaluator'
import { Survey } from '../survey'

/**
 * Provider returning the specified geometries, by area name.
 */
export const createTestAreaOfInterestProvider = (
  geometriesByName: Record<string, AreaOfInterest>
): AreaOfInterestProvider => ({
  getAreaOfInterest: async ({ name }) => geometriesByName[name],
})

/**
 * Survey with the descriptors of the specified areas of interest (in the specified order).
 */
export const withAreasOfInterest = (survey: Survey, names: string[]): Survey => ({
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
