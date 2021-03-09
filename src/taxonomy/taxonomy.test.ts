import { TaxonomyFactory, TaxonomyFactoryParams } from './factory'

describe('taxonomyFactory', () => {
  test('createInstance', () => {
    const taxonomyParams: TaxonomyFactoryParams = {
      props: {
        name: 'Taxonomy',
      },
    }

    const taxonomy = TaxonomyFactory.createInstance(taxonomyParams)

    expect(taxonomy).toHaveProperty('uuid')
    expect(taxonomy).toHaveProperty('draft')
    expect(taxonomy).toHaveProperty('published')

    expect(taxonomy).toHaveProperty('props')
    expect(taxonomy.props.descriptions).toBeUndefined()
    expect(taxonomy.props).toHaveProperty('name')
    expect(taxonomy.props.name).toBe('Taxonomy')
    expect(taxonomy.props.vernacularLanguageCodes).toBeUndefined()
  })
})
