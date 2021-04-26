import { Factory } from '../common'
import { UUIDs } from '../utils'
import { Node } from './node'

export type NodeFactoryParams = {
  nodeDefUuid: string
  recordUuid: string
  parentNode?: Node
  value?: any
}

export const NodeFactory: Factory<Node, NodeFactoryParams> = {
  createInstance: (params: NodeFactoryParams): Node => {
    const { nodeDefUuid, recordUuid, parentNode, value } = params

    return {
      uuid: UUIDs.v4(),
      nodeDefUuid,
      recordUuid,
      parentUuid: parentNode?.uuid,
      value,
      meta: {
        h: [...(parentNode?.meta?.h || []), ...(parentNode?.uuid ? [parentNode?.uuid] : [])],
      },
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
