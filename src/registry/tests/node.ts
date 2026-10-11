import { NodeService, ArenaRecordNode, NodeFactory } from '../../node'

export const nodeMock: ArenaRecordNode = NodeFactory.createInstance({
  nodeDefUuid: 'nodedef_uuid',
  recordUuid: 'record_uuid',
})

export class NodeServiceMock implements NodeService {
  create(): Promise<ArenaRecordNode> {
    throw new Error('Not implemented')
  }

  get(): Promise<ArenaRecordNode> {
    return Promise.resolve(nodeMock)
  }

  update(): Promise<ArenaRecordNode> {
    throw new Error('Not implemented')
  }

  delete(): Promise<void> {
    throw new Error('Not implemented')
  }
}
