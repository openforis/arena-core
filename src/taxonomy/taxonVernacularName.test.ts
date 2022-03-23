import { VernacularNameFactory, VernacularNameParams } from './factory'

describe('VernacularNameFactory', () => {
  test('createInstance', () => {
    const vernacularNameParams: VernacularNameParams = {
      lang: 'eng',
      name: 'vernacular_name',
    }

    const vernacularName = VernacularNameFactory.createInstance(vernacularNameParams)

    expect(vernacularName).toHaveProperty('uuid')
    expect(vernacularName).toHaveProperty('props')
    expect(vernacularName.props).toHaveProperty('lang')
    expect(vernacularName.props.lang).toBe(vernacularNameParams.lang)
    expect(vernacularName.props).toHaveProperty('name')
    expect(vernacularName.props.name).toBe(vernacularNameParams.name)
  })
})
