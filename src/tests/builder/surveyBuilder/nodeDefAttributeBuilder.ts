import { NodeDef, NodeDefEntity, NodeDefType } from '../../../nodeDef'
import { NodeDefBuilder } from './nodeDefBuilder'

export class NodeDefAttributeBuilder extends NodeDefBuilder {
  constructor(name: string, type: NodeDefType = NodeDefType.text) {
    super(name, type)
  }

  key() {
    this.props.key = true
    return this
  }

  build(params: { nodeDefParent?: NodeDefEntity } = {}): { [uuid: string]: NodeDef<NodeDefType> } {
    const { nodeDefParent } = params
    const def: NodeDef<NodeDefType> = this.createNodeDef({ nodeDefParent })
    return { [def.uuid]: def }
  }
}
