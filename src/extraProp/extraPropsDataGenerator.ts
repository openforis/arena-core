import { ExtraPropDataType, ExtraPropDefs } from '.'
import { PointFactory } from '../geo'

const valueByDataType: { [key in ExtraPropDataType]: any } = {
  [ExtraPropDataType.geometryPoint]: PointFactory.createInstance({ x: 12.48904, y: 41.88304 }),
  [ExtraPropDataType.number]: 100,
  [ExtraPropDataType.text]: 'abc',
}

const generateData = (params: { extraPropDefs: ExtraPropDefs }): { [key: string]: any } => {
  const { extraPropDefs } = params
  return Object.values(extraPropDefs).reduce((acc: { [key: string]: any }, extraProp) => {
    acc[extraProp.key] = valueByDataType[extraProp.dataType ?? ExtraPropDataType.text]
    return acc
  }, {})
}

export const ExtraPropsDataGenerator = {
  generateData,
}
