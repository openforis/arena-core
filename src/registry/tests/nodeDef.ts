import { ArenaAnyNodeDef, NodeDefFactory, ArenaNodeDefService, NodeDefType } from '../../nodeDef'

export const nodeDefMock: ArenaAnyNodeDef = NodeDefFactory.createInstance({ type: NodeDefType.text })

export class NodeDefServiceMock implements ArenaNodeDefService {
  create(): Promise<{ [nodeDefUuid: string]: ArenaAnyNodeDef }> {
    throw new Error('Not implemented')
  }

  getMany(): Promise<{ [nodeDefUuid: string]: ArenaAnyNodeDef }> {
    return Promise.resolve({ nodedef_uuid: nodeDefMock })
  }

  update(): Promise<{ [nodeDefUuid: string]: ArenaAnyNodeDef }> {
    throw new Error('Not implemented')
  }

  delete(): Promise<{ [nodeDefUuid: string]: ArenaAnyNodeDef }> {
    throw new Error('Not implemented')
  }
}
