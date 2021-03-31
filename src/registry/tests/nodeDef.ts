import { NodeDefType, NodeDefFactory, NodeDefService, NodeDef, NodeDefProps } from '../../nodeDef'

export const nodeDefMock: NodeDef<NodeDefType, NodeDefProps> = NodeDefFactory.createInstance({ type: NodeDefType.text })

export class NodeDefServiceMock implements NodeDefService {
  create(): Promise<{ [nodeDefUuid: string]: NodeDef<NodeDefType> }> {
    throw new Error('Not implemented')
  }

  getMany(): Promise<{ [nodeDefUuid: string]: NodeDef<NodeDefType> }> {
    return Promise.resolve({ nodedef_uuid: nodeDefMock })
  }

  update(): Promise<{ [nodeDefUuid: string]: NodeDef<NodeDefType> }> {
    throw new Error('Not implemented')
  }

  delete(): Promise<{ [nodeDefUuid: string]: NodeDef<NodeDefType> }> {
    throw new Error('Not implemented')
  }
}
