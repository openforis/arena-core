import { CategoryItem } from '../category'
import { Taxon } from '../taxonomy'

export interface NodeMeta {
  childApplicability?: { [uuid: string]: boolean }
  h: string[]
}

export interface Node {
  dateCreated?: string
  dateModified?: string
  id?: string
  meta: NodeMeta
  nodeDefUuid: string
  parentUuid?: string
  recordUuid: string
  refData?: CategoryItem | Taxon
  uuid: string
  value?: any
  placeholder?: boolean
}
