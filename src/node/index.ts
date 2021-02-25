import { CategoryItem } from 'src/category/categoryItem'

export interface NodeMetaChildApplicability {
  [uuid: string]: boolean
}

export interface NodeMeta {
  childApplicability: NodeMetaChildApplicability
  h: string[]
}

export interface Node {
  dateCreated: string
  dateModified: string
  id: string
  meta: NodeMeta
  nodeDefUuid: string
  parentUuid?: string
  recordUuid: string
  refData?: CategoryItem
  uuid: string
  value?: any
}
