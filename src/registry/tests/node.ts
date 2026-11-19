import { ArenaRecordNodeService, ArenaRecordNode, RecordNodeFactory } from '../../node'

export const nodeMock: ArenaRecordNode = RecordNodeFactory.createInstance({
  nodeDefUuid: 'nodedef_uuid',
  recordUuid: 'record_uuid',
})

export class NodeServiceMock implements ArenaRecordNodeService {
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
