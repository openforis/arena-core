import { Node, NodeFactory, NodeValueCode, NodeValueTaxon } from '../../../node'
import { NodeDefCode, NodeDefTaxon, NodeDefType } from '../../../nodeDef'
import { Survey, Surveys } from '../../../survey'
import { NodeBuilder } from './nodeBuilder'

export class AttributeBuilder extends NodeBuilder {
  private value: any

  constructor(nodeDefName: string, value: any = null) {
    super(nodeDefName)
    this.value = value
  }

  private buildValue(params: { survey: Survey }) {
    const { survey } = params
    const nodeDef = this.getNodeDef({ survey })

    if (nodeDef.type === NodeDefType.code) {
      const nodeDefCode = nodeDef as NodeDefCode
      const code = this.value.code
      const item = Surveys.getCategoryItemByCodePaths({
        survey,
        categoryUuid: nodeDefCode.props.categoryUuid,
        codePaths: [code],
      })
      if (!item) return null

      return {
        itemUuid: item.uuid,
        code: item.props.code,
      } as NodeValueCode
    }
    if (nodeDef.type === NodeDefType.taxon) {
      const nodeDefTaxon = nodeDef as NodeDefTaxon
      const taxonomyUuid = nodeDefTaxon.props.taxonomyUuid
      const taxonValue = this.value as NodeValueTaxon

      const taxon = taxonValue?.code
        ? Surveys.getTaxonByCode({ survey, taxonomyUuid, taxonCode: taxonValue.code })
        : null
      if (!taxon) return null

      return {
        taxonUuid: taxon.uuid,
        code: taxon.props.code,
        scientificName: taxon.props.scientificName,
      } as NodeValueTaxon
    }
    return this.value
  }

  build(params: { survey: Survey; recordUuid: string; parentNode?: Node }): { [nodeUuid: string]: Node } {
    const { survey, recordUuid, parentNode } = params

    const nodeDef = this.getNodeDef({ survey })

    const value = this.buildValue({ survey })

    const attribute = NodeFactory.createInstance({
      nodeDefUuid: nodeDef.uuid,
      parentNode,
      recordUuid,
      value,
    })

    return { [attribute.uuid]: attribute }
  }
}
