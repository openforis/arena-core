import { AttributeBuilder } from './attributeBuilder'
import { EntityBuilder } from './entityBuilder'
import { NodeBuilder } from './nodeBuilder'

export { RecordBuilder } from './recordBuilder'

export const entity = (nodeDefName: string, ...childBuilders: NodeBuilder[]): EntityBuilder =>
  new EntityBuilder(nodeDefName, ...childBuilders)

export const attribute = (nodeDefName: string, value: any = null): AttributeBuilder =>
  new AttributeBuilder(nodeDefName, value)
