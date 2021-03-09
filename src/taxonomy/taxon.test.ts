import { TaxonFactory, TaxonFactoryParams } from './factory'

describe('taxonFactory', () => {
  test('createInstance', () => {
    const taxonParams: TaxonFactoryParams = {
      taxonomyUuid: 'uuid-0001-test',
      props: {
        code: 'CODE',
        family: 'FAMILY',
        genus: 'GENUS',
        scientificName: 'SCIENTIFICNAME',
      },
    }

    const taxon = TaxonFactory.createInstance(taxonParams)

    expect(taxon).toHaveProperty('taxonomyUuid')
    expect(taxon.taxonomyUuid).toBe('uuid-0001-test')

    expect(taxon).toHaveProperty('props')
    expect(taxon.props).toHaveProperty('code')
    expect(taxon.props.code).toBe(taxonParams.props.code)
    expect(taxon.props).toHaveProperty('family')
    expect(taxon.props.family).toBe(taxonParams.props.family)
    expect(taxon.props).toHaveProperty('genus')
    expect(taxon.props.genus).toBe(taxonParams.props.genus)
    expect(taxon.props).toHaveProperty('scientificName')
    expect(taxon.props.scientificName).toBe(taxonParams.props.scientificName)
  })
})
