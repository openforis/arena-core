import { Factory } from 'src/common'
import { Node } from './node'
import { v4 as uuidv4 } from 'uuid'

export type NodeFactoryParams = {
  nodeDefUuid: string
  recordUuid: string
  parentNode?: Node
  value?: any
}

const defaultProps = {
  published: false,
  draft: true,
  collectUri: null,
  descriptions: null,
}

export const NodeFactory: Factory<Node> = {
  createInstance: (params: NodeFactoryParams): Node => {
    const { nodeDefUuid, recordUuid, parentNode, value } = {
      ...defaultProps,
      ...params,
    }

    return {
      uuid: uuidv4(),
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

export const NodePlaceholderFactory: Factory<Node> = {
  createInstance: (params: NodeFactoryParams): Node => {
    return {
      ...NodeFactory.createInstance(params),
      placeholder: true,
    }
  },
}
