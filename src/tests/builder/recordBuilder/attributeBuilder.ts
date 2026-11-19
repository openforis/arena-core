import { ArenaRecordNode, RecordNodeFactory, ArenaRecordNodeValueCode, ArenaRecordNodeValueTaxon } from '../../../node'
import { ArenaRecordNodeMeta } from '../../../node/node'
import { ArenaNodeDef, ArenaNodeDefCode, ArenaNodeDefTaxon, NodeDefType } from '../../../nodeDef'
import { ArenaRecord, Records } from '../../../record'
import { ArenaSurvey, Surveys } from '../../../survey'
import { NodeBuilder } from './nodeBuilder'

export class AttributeBuilder extends NodeBuilder {
  private readonly value: any

  constructor(nodeDefName: string, value: any = null) {
    super(nodeDefName)
    this.value = value
  }

  private buildCodeValue(params: { survey: ArenaSurvey; nodeDef: ArenaNodeDefCode }) {
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
    } as ArenaRecordNodeValueCode
  }

  private buildTaxonValue(params: { survey: ArenaSurvey; nodeDef: ArenaNodeDefTaxon }) {
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
    } as ArenaRecordNodeValueTaxon
  }

  private buildValue(params: { survey: ArenaSurvey }) {
    const { survey } = params
    const nodeDef = this.getNodeDef({ survey })

    if (this.value === null || this.value === undefined) return null

    if (nodeDef.type === NodeDefType.code) {
      return this.buildCodeValue({ survey, nodeDef: nodeDef as ArenaNodeDefCode })
    }
    if (nodeDef.type === NodeDefType.taxon) {
      return this.buildTaxonValue({ survey, nodeDef: nodeDef as ArenaNodeDefTaxon })
    }
    return this.value
  }

  private buildMeta(params: {
    nodeDef: ArenaNodeDef<any>
    record: ArenaRecord
    parentNode?: ArenaRecordNode
  }): ArenaRecordNodeMeta {
    const { nodeDef, record, parentNode } = params

    const meta: ArenaRecordNodeMeta = {}

    if (nodeDef.type === NodeDefType.code) {
      const nodeDefCode = nodeDef as ArenaNodeDefCode
      if (nodeDefCode.props.parentCodeDefUuid && parentNode) {
        const parentCodeAttribute = Records.getParentCodeAttribute(parentNode, nodeDefCode)(record)
        if (!parentCodeAttribute) throw new Error('Could not find the parent code attibute')
        return { ...meta, hCode: [parentCodeAttribute.uuid] }
      }
    }

    return meta
  }

  build(params: { survey: ArenaSurvey; record: ArenaRecord; parentNode?: ArenaRecordNode }): ArenaRecord {
    const { survey, record, parentNode } = params

    const nodeDef = this.getNodeDef({ survey })

    const value = this.buildValue({ survey })

    const attribute = RecordNodeFactory.createInstance({
      nodeDefUuid: nodeDef.uuid,
      parentNode,
      recordUuid: record.uuid,
      value,
    })
    attribute.meta = {
      ...attribute.meta,
      ...this.buildMeta({ nodeDef, parentNode, record }),
    }
    return Records.addNode(attribute)(record)
  }
}
