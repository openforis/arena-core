import { NodeService, Node, NodeFactory } from '../../node'
import { RecordFactory } from '../../record'
import { createTestAdminUser } from '../../tests/data'
import { UUIDs } from '../../utils'

const user = createTestAdminUser()
const record = RecordFactory.createInstance({ surveyUuid: UUIDs.v4(), user })

export const nodeMock: Node = NodeFactory.createInstance({ nodeDefUuid: 'nodedef_uuid', record })

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
