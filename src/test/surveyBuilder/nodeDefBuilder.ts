import { Survey } from '../../survey'
import { NodeDef, NodeDefFactory, NodeDefEntity, NodeDefProps, NodeDefPropsAdvanced, NodeDefType } from '../../nodeDef'

export abstract class NodeDefBuilder {
  props: NodeDefProps
  propsAdvanced: NodeDefPropsAdvanced
  type: NodeDefType

  constructor(name: string, type: NodeDefType) {
    this.type = type
    this.props = {
      name,
    }
    this.propsAdvanced = {}
  }

  _createNodeDef(params: { nodeDefParent?: NodeDefEntity } = {}): NodeDef<NodeDefType, NodeDefProps> {
    return NodeDefFactory.createInstance({
      nodeDefParent: params.nodeDefParent,
      type: this.type,
      props: this.props,
      propsAdvanced: this.propsAdvanced,
    })
  }

  multiple() {
    this.props.multiple = true
    return true
  }

  abstract build(params: { survey: Survey; nodeDefParent?: NodeDefEntity }): { [uuid: string]: NodeDef<NodeDefType> }
}
