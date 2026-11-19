import { ArenaNodeDef, ArenaNodeDefEntity, ArenaNodeDefEntityProps, NodeDefType } from '../../../nodeDef'
import { ArenaSurvey } from '../../../survey'
import { NodeDefBuilder } from './nodeDefBuilder'

export class NodeDefEntityBuilder extends NodeDefBuilder {
  protected childBuilders: NodeDefBuilder[]

  constructor(name: string, ...childBuilders: NodeDefBuilder[]) {
    super(name, NodeDefType.entity)
    this.childBuilders = childBuilders
  }

  enumerate(): this {
    const p = this.props as ArenaNodeDefEntityProps
    p.enumerate = true
    return this
  }

  enumeratingItemsExpression(expression: string): this {
    this.propsAdvanced.enumeratingItemsExpression = expression
    return this
  }

  autoCreateMinCountItems(): this {
    const p = this.props as ArenaNodeDefEntityProps
    p.autoCreateMinCountItems = true
    return this
  }

  build(params: { survey: ArenaSurvey; nodeDefParent?: ArenaNodeDefEntity }): {
    [uuid: string]: ArenaNodeDef<NodeDefType>
  } {
    const { survey, nodeDefParent } = params
    const def: ArenaNodeDefEntity = this.createNodeDef({ nodeDefParent }) as ArenaNodeDefEntity

    let surveyUpdated = { ...survey }

    return this.childBuilders.reduce(
      (nodeDefsAcc: { [uuid: string]: ArenaNodeDef<NodeDefType> }, childBuilder: NodeDefBuilder) => {
        const nodeDefs = childBuilder.build({ survey: surveyUpdated, nodeDefParent: def })
        surveyUpdated = { ...survey, nodeDefs: { ...surveyUpdated.nodeDefs, ...nodeDefs } }
        return { ...nodeDefsAcc, ...nodeDefs }
      },
      { [def.uuid]: def }
    )
  }
}
