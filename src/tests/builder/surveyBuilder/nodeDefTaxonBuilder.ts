import { NodeDef, NodeDefEntity, NodeDefTaxon, NodeDefType } from '../../../nodeDef'
import { Survey, Surveys } from '../../../survey'
import { NodeDefAttributeBuilder } from './nodeDefAttributeBuilder'

export class NodeDefTaxonBuilder extends NodeDefAttributeBuilder {
  protected taxonomyName: string

  constructor(name: string, taxonomyName: string) {
    super(name, NodeDefType.taxon)
    this.taxonomyName = taxonomyName
  }

  build(params: { survey: Survey; nodeDefParent?: NodeDefEntity }): { [uuid: string]: NodeDef<NodeDefType> } {
    const { survey } = params
    const result = super.build(params)

    const taxonomy = this.taxonomyName ? Surveys.getTaxonomyByName({ survey, taxonomyName: this.taxonomyName }) : null
    if (!taxonomy) {
      throw new Error(`Taxonomy with name "${this.taxonomyName}" not found`)
    }
    const nodeDef = Object.values(result)[0] as NodeDefTaxon
    nodeDef.props.taxonomyUuid = taxonomy.uuid

    return result
  }
}
