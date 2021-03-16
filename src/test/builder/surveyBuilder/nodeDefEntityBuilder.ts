import { NodeDef, NodeDefEntity, NodeDefType } from '../../../nodeDef'
import { Survey } from '../../../survey'
import { NodeDefBuilder } from './nodeDefBuilder'

export class NodeDefEntityBuilder extends NodeDefBuilder {
  childBuilders: NodeDefBuilder[]

  constructor(name: string, ...childBuilders: NodeDefBuilder[]) {
    super(name, NodeDefType.entity)
    this.childBuilders = childBuilders
  }

  build(params: { survey: Survey; nodeDefParent?: NodeDefEntity }): { [uuid: string]: NodeDef<NodeDefType> } {
    const { survey, nodeDefParent } = params
    const def: NodeDefEntity = this.createNodeDef({ nodeDefParent }) as NodeDefEntity

    return this.childBuilders.reduce(
      (nodeDefsAcc: { [uuid: string]: NodeDef<NodeDefType> }, childBuilder: NodeDefBuilder) => {
        const nodeDefs = childBuilder.build({ survey, nodeDefParent: def })
        return { ...nodeDefsAcc, ...nodeDefs }
      },
      { [def.uuid]: def }
    )
  }
}
