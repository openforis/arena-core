import { ArenaNodeDef, ArenaNodeDefLayout, ArenaNodeDefPropsWithLayout, NodeDefType } from '../nodeDef'

export enum NodeDefTextInputType {
  singleLine = 'singleLine',
  multiLine = 'multiLine',
}

export enum NodeDefTextRenderType {
  text = 'text',
  hyperlink = 'hyperlink',
  markdown = 'markdown',
}

export interface ArenaNodeDefTextLayout extends ArenaNodeDefLayout {
  renderType: NodeDefTextRenderType
}

export interface ArenaNodeDefTextProps extends ArenaNodeDefPropsWithLayout<ArenaNodeDefTextLayout> {
  textInputType: NodeDefTextInputType
  textTransform: 'none' | 'capitalize' | 'lowercase' | 'uppercase'
}

export type ArenaNodeDefText = ArenaNodeDef<NodeDefType.text, ArenaNodeDefTextProps>
