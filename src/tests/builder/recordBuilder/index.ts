import { AttributeBuilder } from './attributeBuilder'
import { EntityBuilder } from './entityBuilder'
import { NodeBuilder } from './nodeBuilder'

export { RecordBuilder } from './recordBuilder'

const attribute = (nodeDefName: string, value: any = null): AttributeBuilder => new AttributeBuilder(nodeDefName, value)

const entity = (nodeDefName: string, ...childBuilders: NodeBuilder[]): EntityBuilder =>
  new EntityBuilder(nodeDefName, ...childBuilders)

export const RecordNodeBuilders = {
  attribute,
  entity,
}
