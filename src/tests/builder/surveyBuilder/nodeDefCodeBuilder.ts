import { NodeDef, NodeDefCode, NodeDefEntity, NodeDefType } from '../../../nodeDef'
import { Survey, Surveys } from '../../../survey'
import { NodeDefAttributeBuilder } from './nodeDefAttributeBuilder'

export class NodeDefCodeBuilder extends NodeDefAttributeBuilder {
  protected categoryName: string

  constructor(name: string, categoryName: string) {
    super(name, NodeDefType.code)
    this.categoryName = categoryName
  }

  build(params: { survey: Survey; nodeDefParent?: NodeDefEntity }): { [uuid: string]: NodeDef<NodeDefType> } {
    const { survey } = params
    const result = super.build(params)

    const category = this.categoryName ? Surveys.getCategoryByName({ survey, categoryName: this.categoryName }) : null
    if (!category) {
      throw new Error(`Category with name "${this.categoryName}" not found`)
    }
    const nodeDef = Object.values(result)[0] as NodeDefCode
    nodeDef.props.categoryUuid = category.uuid

    return result
  }
}
