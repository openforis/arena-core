import { NodeService, Node, NodeFactory } from '../../node'

export const nodeMock: Node = NodeFactory.createInstance({ nodeDefUuid: 'nodedef_uuid', recordUuid: 'record_uuid' })

export class NodeServiceMock implements NodeService {
  create(): Promise<Node> {
    throw new Error('Not implemented')
  }

  get(): Promise<Node> {
    return Promise.resolve(nodeMock)
  }

  update(): Promise<Node> {
    throw new Error('Not implemented')
  }

  delete(): Promise<void> {
    throw new Error('Not implemented')
  }
}
