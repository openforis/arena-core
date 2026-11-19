export enum ExtraPropDataType {
  text = 'text',
  number = 'number',
  geometryPoint = 'geometryPoint',
}

export interface ArenaExtraPropDef {
  key: string
  dataType?: ExtraPropDataType
}

export interface ArenaExtraPropDefs {
  [key: string]: ArenaExtraPropDef
}
