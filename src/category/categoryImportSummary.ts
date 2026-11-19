import { ExtraPropDataType } from '../extraProp'
import { LanguageCode } from '../language'

export enum CategoryImportColumnType {
  code = 'code',
  description = 'description',
  extra = 'extra',
  label = 'label',
}

export interface ArenaCategoryImportSummaryColumn {
  dataType: ExtraPropDataType
  lang: LanguageCode
  levelIndex: number
  levelName: string
  name: string
  type: CategoryImportColumnType
}

export interface ArenaCategoryImportSummary {
  columns: { [key: string]: ArenaCategoryImportSummaryColumn }
  filePath: string
}
