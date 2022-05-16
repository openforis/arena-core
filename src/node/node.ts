import { CategoryItem } from '../category'
import { Taxon } from '../taxonomy'

export interface NodeMeta {
  childApplicability?: { [uuid: string]: boolean }
  h?: string[]
  defaultValueApplied?: boolean
}

export interface Node {
  dateCreated?: string
  dateModified?: string
  id?: string
  meta?: NodeMeta
  nodeDefUuid: string
  parentUuid?: string
  recordUuid: string
  refData?: CategoryItem | Taxon
  uuid: string
  value?: any
  placeholder?: boolean
  surveyUuid?: string

  created?: boolean
  deleted?: boolean
}
