import { ExtraPropDataType, ExtraPropDef } from '.'
import { Points } from '../geo'
import { Survey } from '../survey'
import { Objects } from '../utils'

const covertersByType: { [key in ExtraPropDataType]: (params: { survey: Survey; value: any }) => any } = {
  [ExtraPropDataType.geometryPoint]: (params: { value: any }) => Points.parse(params.value),
  [ExtraPropDataType.number]: (params: { value: any }) => Number(params.value),
  [ExtraPropDataType.text]: (params: { value: any }) => String(params.value),
}

const getDataType = (extraPropDef: ExtraPropDef): ExtraPropDataType => extraPropDef.dataType || ExtraPropDataType.text

const convertValue = (params: { survey: Survey; extraPropDef: ExtraPropDef; value: any }) => {
  const { survey, extraPropDef, value } = params
  if (Objects.isEmpty(value)) return null

  const converter = covertersByType[getDataType(extraPropDef)]
  return converter({ survey, value })
}

export const ExtraProps = {
  getDataType,
  convertValue,
}
