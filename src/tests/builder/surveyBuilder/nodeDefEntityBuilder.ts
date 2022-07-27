import { NodeDef, NodeDefEntity, NodeDefType } from '../../../nodeDef'
import { Survey } from '../../../survey'
import { NodeDefBuilder } from './nodeDefBuilder'

export class NodeDefEntityBuilder extends NodeDefBuilder {
  protected childBuilders: NodeDefBuilder[]

  constructor(name: string, ...childBuilders: NodeDefBuilder[]) {
    super(name, NodeDefType.entity)
    this.childBuilders = childBuilders
  }

  build(params: { survey: Survey; nodeDefParent?: NodeDefEntity }): { [uuid: string]: NodeDef<NodeDefType> } {
    const { survey, nodeDefParent } = params
    const def: NodeDefEntity = this.createNodeDef({ nodeDefParent }) as NodeDefEntity

    let surveyUpdated = { ...survey }

    return this.childBuilders.reduce(
      (nodeDefsAcc: { [uuid: string]: NodeDef<NodeDefType> }, childBuilder: NodeDefBuilder) => {
        const nodeDefs = childBuilder.build({ survey: surveyUpdated, nodeDefParent: def })
        surveyUpdated = { ...survey, nodeDefs: { ...surveyUpdated.nodeDefs, ...nodeDefs } }
        return { ...nodeDefsAcc, ...nodeDefs }
      },
      { [def.uuid]: def }
    )
  }
}
