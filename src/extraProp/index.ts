export enum ExtraPropDataType {
  text = 'text',
  number = 'number',
  geometryPoint = 'geometryPoint',
}

export interface ExtraPropDef {
  key: string
  dataType?: ExtraPropDataType
}

export interface ExtraPropDefs {
  [key: string]: ExtraPropDef
}

export { ExtraPropsDataGenerator } from './extraPropsDataGenerator'
