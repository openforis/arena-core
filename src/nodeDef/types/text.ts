import { NodeDef, NodeDefLayout, NodeDefPropsWithLayout, NodeDefType } from '../nodeDef'

export enum NodeDefTextRenderType {
  text = 'text',
  hyperlink = 'hyperlink',
  markdown = 'markdown',
}

export interface NodeDefTextLayout extends NodeDefLayout {
  renderType: NodeDefTextRenderType
}

export interface NodeDefTextProps extends NodeDefPropsWithLayout<NodeDefTextLayout> {
  textTransform: 'none' | 'capitalize' | 'lowercase' | 'uppercase'
}

export type NodeDefText = NodeDef<NodeDefType.text, NodeDefTextProps>
