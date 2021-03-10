import { Factory } from 'src/common'
import { NodeDef, NodeDefType, NodeDefProps, NodeDefPropsAdvanced } from './nodeDef'
import { UUIDs } from '../utils'

export type NodeDefFactoryParams = {
  analysis?: boolean
  nodeDefParent?: NodeDef<NodeDefType>
  props?: NodeDefProps
  propsAdvanced?: NodeDefPropsAdvanced
  type: NodeDefType
  virtual?: boolean
}

export const NodeDefFactory: Factory<NodeDef<NodeDefType, NodeDefProps>> = {
  createInstance: (params: NodeDefFactoryParams): NodeDef<NodeDefType, NodeDefProps> => {
    const defaultProps = {
      analysis: false,
      draft: true,
      nodeDefParent: null,
      props: {},
      propsDraft: {},
      published: false,
      temporary: true,
      virtual: false,
    }

    const { analysis, draft, nodeDefParent, props, propsAdvanced, published, temporary, type, virtual } = {
      ...defaultProps,
      ...params,
    }

    return {
      analysis,
      draft,
      meta: {
        h: [...(nodeDefParent?.meta?.h || []), ...(nodeDefParent?.uuid ? [nodeDefParent?.uuid] : [])],
      },
      parentUuid: nodeDefParent?.uuid,
      props,
      propsAdvanced,
      published,
      temporary,
      type,
      uuid: UUIDs.v4(),
      virtual,
    }
  },
}
