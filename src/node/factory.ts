import { Factory } from '../common'
import { Dates, UUIDs } from '../utils'
import { Node } from './node'

export type NodeFactoryParams = {
  nodeDefUuid: string
  recordUuid: string
  parentNode?: Node
  surveyUuid?: string
  value?: any
}

export const NodeFactory: Factory<Node, NodeFactoryParams> = {
  createInstance: (params: NodeFactoryParams): Node => {
    const { nodeDefUuid, recordUuid, parentNode, surveyUuid, value } = params
    const now = Dates.nowFormattedForStorage()
    return {
      dateCreated: now,
      dateModified: now,
      meta: {
        h: [...(parentNode?.meta?.h || []), ...(parentNode?.uuid ? [parentNode?.uuid] : [])],
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

export const NodePlaceholderFactory: Factory<Node, NodeFactoryParams> = {
  createInstance: (params: NodeFactoryParams): Node => {
    return {
      ...NodeFactory.createInstance(params),
      placeholder: true,
    }
  },
}
