import { Factory } from '../common'
import { Record } from '../record'
import { Dates } from '../utils'
import { Node } from './node'

export type NodeFactoryParams = {
  record: Record
  nodeDefUuid: string
  parentNode?: Node
  surveyUuid?: string
  value?: any
}

/**
 * Creates a node with internal ID = record.lastNodeInternalId + 1.
 * The record is not modified: the node must be added to the record (Records.addNode/addNodes, which update
 * record.lastNodeInternalId) before creating another node, otherwise the same internal ID would be generated.
 */
export const NodeFactory: Factory<Node, NodeFactoryParams> = {
  createInstance: (params: NodeFactoryParams): Node => {
    const { nodeDefUuid, record, parentNode, surveyUuid, value } = params

    const iId = (record.lastNodeInternalId ?? 0) + 1

    const now = Dates.nowFormattedForStorage()

    return {
      created: true,
      dateCreated: now,
      dateModified: now,
      iId,
      nodeDefUuid,
      pIId: parentNode?.iId,
      recordUuid: record.uuid,
      surveyUuid,
      value,
    }
  },
}

export const NodePlaceholderFactory: Factory<Node, NodeFactoryParams> = {
  createInstance: (params: NodeFactoryParams): Node => {
    return {
      ...NodeFactory.createInstance(params),
      placeholder: true,
    }
  },
}
