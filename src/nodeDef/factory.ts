import { ArenaFactory } from '../common'
import { UUIDs } from '../utils'
import { ArenaNodeDef, NodeDefType, ArenaNodeDefProps, ArenaNodeDefPropsAdvanced } from './nodeDef'

export type NodeDefFactoryParams = {
  analysis?: boolean
  nodeDefParent?: ArenaNodeDef<NodeDefType>
  props?: ArenaNodeDefProps
  propsAdvanced?: ArenaNodeDefPropsAdvanced
  type: NodeDefType
  virtual?: boolean
}

const defaultProps = {
  analysis: false,
  draft: true,
  nodeDefParent: null,
  published: false,
  temporary: true,
  virtual: false,
}

export const NodeDefFactory: ArenaFactory<ArenaNodeDef<NodeDefType>, NodeDefFactoryParams> = {
  createInstance: (params: NodeDefFactoryParams): ArenaNodeDef<NodeDefType> => {
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
      props: props ?? {},
      propsAdvanced,
      published,
      temporary,
      type,
      uuid: UUIDs.v4(),
      virtual,
    }
  },
}
