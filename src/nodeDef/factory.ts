import { Factory } from '../common'
import { UUIDs } from '../utils'
import { NodeDef, NodeDefType, NodeDefProps, NodeDefPropsAdvanced } from './nodeDef'

export type NodeDefFactoryParams = {
  analysis?: boolean
  nodeDefParent?: NodeDef<NodeDefType>
  props?: NodeDefProps
  propsAdvanced?: NodeDefPropsAdvanced
  type: NodeDefType
  virtual?: boolean
}

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

export const NodeDefFactory: Factory<NodeDef<NodeDefType>, NodeDefFactoryParams> = {
  createInstance: (params: NodeDefFactoryParams): NodeDef<NodeDefType> => {
    const { analysis, draft, nodeDefParent, props, propsAdvanced, published, temporary, type, virtual } = {
      ...defaultProps,
      ...params,
    }

    return {
      analysis,
      draft,
      meta: {
        h: nodeDefParent ? [...nodeDefParent.meta.h, nodeDefParent.uuid] : [],
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
