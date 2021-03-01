import { LanguageCode } from 'src/language'
import { CategoryItemExtraDefDataType } from './category'

export enum ImportColumnType {
  code = 'code',
  description = 'description',
  extra = 'extra',
  label = 'label',
}

export interface ImportSummaryColumn {
  dataType: CategoryItemExtraDefDataType
  lang: LanguageCode
  levelIndex: number
  levelName: string
  name: string
  type: ImportColumnType
}

export interface ImportSummary {
  columns: { [key: string]: ImportSummaryColumn }
  filePath: string
}
