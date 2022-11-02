import { ExtraPropDataType, ExtraPropDef } from '.'
import { Points } from '../geo'
import { Objects } from '../utils'

const covertersByType: { [key in ExtraPropDataType]: (value: any) => any } = {
  [ExtraPropDataType.geometryPoint]: (value: any) => Points.parse(value),
  [ExtraPropDataType.number]: (value: any) => Number(value),
  [ExtraPropDataType.text]: (value: any) => String(value),
}

const convertValue = (value: any) => (extraProp: ExtraPropDef) => {
  if (Objects.isEmpty(value)) return null

  const converter = covertersByType[extraProp.dataType || ExtraPropDataType.text]
  return converter(value)
}

export const ExtraProps = {
  convertValue,
}
