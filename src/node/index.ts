import { CategoryItem } from 'src/category/item'
import { Taxon } from 'src/taxonomy/taxon'

export interface NodeMeta {
  childApplicability: { [uuid: string]: boolean }
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
  refData?: CategoryItem | Taxon
  uuid: string
  value?: any
}
