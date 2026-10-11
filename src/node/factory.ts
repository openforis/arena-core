import { Factory } from '../common'
import { Dates, UUIDs } from '../utils'
import { ArenaRecordNode } from './node'

export type NodeFactoryParams = {
  nodeDefUuid: string
  recordUuid: string
  parentNode?: ArenaRecordNode
  surveyUuid?: string
  value?: any
}

export const NodeFactory: Factory<ArenaRecordNode, NodeFactoryParams> = {
  createInstance: (params: NodeFactoryParams): ArenaRecordNode => {
    const { nodeDefUuid, recordUuid, parentNode, surveyUuid, value } = params
    const now = Dates.nowFormattedForStorage()

    return {
      created: true,
      dateCreated: now,
      dateModified: now,
      meta: {
        h: [...(parentNode?.meta?.h ?? []), ...(parentNode?.uuid ? [parentNode?.uuid] : [])],
      },
      nodeDefUuid,
      parentUuid: parentNode?.uuid,
      recordUuid,
      surveyUuid,
      value,
      uuid: UUIDs.v4(),
    }
  },
}

export const NodePlaceholderFactory: Factory<ArenaRecordNode, NodeFactoryParams> = {
  createInstance: (params: NodeFactoryParams): ArenaRecordNode => {
    return {
      ...NodeFactory.createInstance(params),
      placeholder: true,
    }
  },
}
