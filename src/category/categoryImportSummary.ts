import { LanguageCode } from 'src/language'
import { CategoryItemExtraDefDataType } from './category'

export enum CategoryImportColumnType {
  code = 'code',
  description = 'description',
  extra = 'extra',
  label = 'label',
}

export interface CategoryImportSummaryColumn {
  dataType: CategoryItemExtraDefDataType
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
