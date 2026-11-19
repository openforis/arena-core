import { ArenaRecordNode } from '../../../node'
import { ArenaAnyNodeDef } from '../../../nodeDef'
import { ArenaRecord } from '../../../record'
import { ArenaSurvey } from '../../../survey'

export abstract class NodeBuilder {
  protected nodeDefName: string

  constructor(nodeDefName: string) {
    this.nodeDefName = nodeDefName
  }

  protected getNodeDef(params: { survey: ArenaSurvey }): ArenaAnyNodeDef {
    const nodeDef = Object.values(params.survey.nodeDefs ?? {}).find((n) => n.props.name === this.nodeDefName)

    if (!nodeDef) {
      throw new Error(`Node def with name ${this.nodeDefName} not found in survey`)
    }

    return nodeDef
  }

  abstract build(params: { survey: ArenaSurvey; record: ArenaRecord; parentNode?: ArenaRecordNode }): ArenaRecord
}
