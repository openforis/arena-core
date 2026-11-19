import { ArenaNodeDef, NodeDefFactory, ArenaNodeDefService, NodeDefType } from '../../nodeDef'

export const nodeDefMock: ArenaNodeDef<NodeDefType> = NodeDefFactory.createInstance({ type: NodeDefType.text })

export class NodeDefServiceMock implements ArenaNodeDefService {
  create(): Promise<{ [nodeDefUuid: string]: ArenaNodeDef<NodeDefType> }> {
    throw new Error('Not implemented')
  }

  getMany(): Promise<{ [nodeDefUuid: string]: ArenaNodeDef<NodeDefType> }> {
    return Promise.resolve({ nodedef_uuid: nodeDefMock })
  }

  update(): Promise<{ [nodeDefUuid: string]: ArenaNodeDef<NodeDefType> }> {
    throw new Error('Not implemented')
  }

  delete(): Promise<{ [nodeDefUuid: string]: ArenaNodeDef<NodeDefType> }> {
    throw new Error('Not implemented')
  }
}
