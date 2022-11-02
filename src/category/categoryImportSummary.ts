import { ExtraPropDataType } from '../extraProp'
import { LanguageCode } from '../language'

export enum CategoryImportColumnType {
  code = 'code',
  description = 'description',
  extra = 'extra',
  label = 'label',
}

export interface CategoryImportSummaryColumn {
  dataType: ExtraPropDataType
  lang: LanguageCode
  levelIndex: number
  levelName: string
  name: string
  type: CategoryImportColumnType
}

export interface CategoryImportSummary {
  columns: { [key: string]: CategoryImportSummaryColumn }
  filePath: string
}
