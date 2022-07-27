import { Node, NodeFactory, NodeValueCode, NodeValueTaxon } from '../../../node'
import { NodeMeta } from '../../../node/node'
import { NodeDef, NodeDefCode, NodeDefTaxon, NodeDefType } from '../../../nodeDef'
import { Record, Records } from '../../../record'
import { Survey, Surveys } from '../../../survey'
import { NodeBuilder } from './nodeBuilder'

export class AttributeBuilder extends NodeBuilder {
  private value: any

  constructor(nodeDefName: string, value: any = null) {
    super(nodeDefName)
    this.value = value
  }

  private buildCodeValue(params: { survey: Survey; nodeDef: NodeDefCode }) {
    const { survey, nodeDef } = params

    if (this.value.itemUuid) {
      // value is already a NodeValueCode object
      return this.value
    }

    const code = this.value
    const item = Surveys.getCategoryItemByCodePaths({
      survey,
      categoryUuid: nodeDef.props.categoryUuid,
      codePaths: [code],
    })
    if (!item) {
      throw new Error(`could not find category item with code: ${code}`)
    }

    return {
      itemUuid: item.uuid,
      code: item.props.code,
    } as NodeValueCode
  }

  private buildTaxonValue(params: { survey: Survey; nodeDef: NodeDefTaxon }) {
    const { survey, nodeDef } = params

    if (this.value.taxonUuid) {
      // value is already a NodeValueTaxon object
      return this.value
    }
    const taxonCode = this.value.code || this.value
    const taxonomyUuid = nodeDef.props.taxonomyUuid

    const taxon = Surveys.getTaxonByCode({ survey, taxonomyUuid, taxonCode })
    if (!taxon) {
      throw new Error(`could not find taxon with code: ${JSON.stringify(taxonCode)}`)
    }

    return {
      taxonUuid: taxon.uuid,
      code: taxon.props.code,
      scientificName: taxon.props.scientificName,
    } as NodeValueTaxon
  }

  private buildValue(params: { survey: Survey }) {
    const { survey } = params
    const nodeDef = this.getNodeDef({ survey })

    if (this.value === null || this.value === undefined) return null

    if (nodeDef.type === NodeDefType.code) {
      return this.buildCodeValue({ survey, nodeDef: nodeDef as NodeDefCode })
    }
    if (nodeDef.type === NodeDefType.taxon) {
      return this.buildTaxonValue({ survey, nodeDef: nodeDef as NodeDefTaxon })
    }
    return this.value
  }

  private buildMeta(params: { nodeDef: NodeDef<any>; record: Record; parentNode?: Node }): NodeMeta | undefined {
    const { nodeDef, record, parentNode } = params
    if (nodeDef.type === NodeDefType.code) {
      const nodeDefCode = nodeDef as NodeDefCode
      if (nodeDefCode.props.parentCodeDefUuid) {
        if (parentNode) {
          const parentCodeAttribute = Records.getParentCodeAttribute({ parentNode, nodeDef: nodeDefCode })(record)
          if (!parentCodeAttribute) throw new Error('Could not find the parent code attibute')
          return { hCode: [parentCodeAttribute.uuid] }
        }
      }
    }
    return undefined
  }

  build(params: { survey: Survey; record: Record; parentNode?: Node }): Record {
    const { survey, record, parentNode } = params

    const nodeDef = this.getNodeDef({ survey })

    const value = this.buildValue({ survey })

    const attribute = NodeFactory.createInstance({
      nodeDefUuid: nodeDef.uuid,
      parentNode,
      recordUuid: record.uuid,
      value,
    })

    const meta = this.buildMeta({ nodeDef, parentNode, record })
    if (meta) attribute.meta = meta

    return Records.addNode(attribute)(record)
  }
}
