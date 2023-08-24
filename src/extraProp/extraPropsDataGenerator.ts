import { ExtraPropDataType, ExtraPropDefs } from '.'
import { PointFactory } from '../geo'
import { ExtraProps } from './extraProps'

const valueByDataType: { [key in ExtraPropDataType]: any } = {
  [ExtraPropDataType.geometryPoint]: PointFactory.createInstance({ x: 12.48904, y: 41.88304 }),
  [ExtraPropDataType.number]: 100,
  [ExtraPropDataType.text]: 'abc',
}

const generateData = (params: { extraPropDefs: ExtraPropDefs }): { [key: string]: any } => {
  const { extraPropDefs } = params
  return Object.entries(extraPropDefs).reduce((acc: { [key: string]: any }, [key, extraProp]) => {
    acc[key] = valueByDataType[ExtraProps.getDataType(extraProp)]
    return acc
  }, {})
}

export const ExtraPropsDataGenerator = {
  generateData,
}
