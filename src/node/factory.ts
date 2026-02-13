import { Factory } from '../common'
import { Record } from '../record'
import { Dates } from '../utils'
import { Node } from './node'

export type NodeFactoryParams = {
  record: Record
  nodeDefUuid: string
  parentNode?: Node
  surveyUuid?: string
  value?: any
}

export const NodeFactory: Factory<Node, NodeFactoryParams> = {
  createInstance: (params: NodeFactoryParams): Node => {
    const { nodeDefUuid, record, parentNode, surveyUuid, value } = params

    const iId = (record.lastInternalId ?? 0) + 1

    const now = Dates.nowFormattedForStorage()

    const { iId: pId, meta: pMeta } = parentNode ?? {}

    const h = [...(pMeta?.h ?? [])]
    if (pId) {
      h.push(pId)
    }

    return {
      created: true,
      dateCreated: now,
      dateModified: now,
      iId,
      meta: { h },
      nodeDefUuid,
      pIId: parentNode?.iId,
      recordUuid: record.uuid,
      surveyUuid,
      value,
    }
  },
}

export const NodePlaceholderFactory: Factory<Node, NodeFactoryParams> = {
  createInstance: (params: NodeFactoryParams): Node => {
    return {
      ...NodeFactory.createInstance(params),
      placeholder: true,
    }
  },
}
