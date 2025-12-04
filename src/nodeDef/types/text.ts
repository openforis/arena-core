import { NodeDef, NodeDefLayout, NodeDefPropsWithLayout, NodeDefType } from '../nodeDef'

export enum NodeDefTextInputType {
  singleLine = 'singleLine',
  multiLine = 'multiLine',
}

export enum NodeDefTextRenderType {
  text = 'text',
  hyperlink = 'hyperlink',
  markdown = 'markdown',
}

export interface NodeDefTextLayout extends NodeDefLayout {
  renderType: NodeDefTextRenderType
}

export interface NodeDefTextProps extends NodeDefPropsWithLayout<NodeDefTextLayout> {
  textInputType: NodeDefTextInputType
  textTransform: 'none' | 'capitalize' | 'lowercase' | 'uppercase'
}

export type NodeDefText = NodeDef<NodeDefType.text, NodeDefTextProps>
