import { NodeDef, NodeDefCode, NodeDefEntity, NodeDefType } from '../../../nodeDef'
import { Survey, Surveys } from '../../../survey'
import { NodeDefAttributeBuilder } from './nodeDefAttributeBuilder'

export class NodeDefCodeBuilder extends NodeDefAttributeBuilder {
  protected categoryName: string
  protected parentCodeAttributeName: string | undefined

  constructor(name: string, categoryName: string) {
    super(name, NodeDefType.code)
    this.categoryName = categoryName
  }

  parentCodeAttribute(parentCodeAttributeName: string): NodeDefAttributeBuilder {
    this.parentCodeAttributeName = parentCodeAttributeName
    return this
  }

  build(params: { survey: Survey; nodeDefParent?: NodeDefEntity }): { [uuid: string]: NodeDef<NodeDefType> } {
    const { survey } = params
    const result = super.build(params)

    const category = this.categoryName ? Surveys.getCategoryByName({ survey, categoryName: this.categoryName }) : null
    if (!category) {
      throw new Error(`Category with name "${this.categoryName}" not found`)
    }
    const nodeDef: NodeDefCode = Object.values(result)[0] as NodeDefCode
    nodeDef.props.categoryUuid = category.uuid
    if (this.parentCodeAttributeName) {
      const parentCodeDef = Surveys.getNodeDefByName({ survey, name: this.parentCodeAttributeName })
      nodeDef.props.parentCodeDefUuid = parentCodeDef.uuid
    }

    return result
  }
}
