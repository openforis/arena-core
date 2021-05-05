import { NodeDefFactory, NodeDefFactoryParams } from './factory'
import { NodeDef, NodeDefType } from './nodeDef'

const clusterParams: NodeDefFactoryParams = {
  analysis: false,
  props: {
    name: 'cluster',
    multiple: false,
  },
  type: NodeDefType.entity,
  virtual: false,
}
const cluster = NodeDefFactory.createInstance(clusterParams)

const dbhParams: NodeDefFactoryParams = {
  analysis: true,
  nodeDefParent: cluster,
  props: {
    name: 'dbh',
    multiple: false,
  },
  type: NodeDefType.decimal,
  virtual: false,
}
const dbh = NodeDefFactory.createInstance(dbhParams)

const testNodeDef = (nodeDef: NodeDef<any>, params: NodeDefFactoryParams) =>
  test(`createInstance ${nodeDef.props.name}`, () => {
    const { analysis, nodeDefParent, props, type, virtual } = params

    expect(nodeDef).toHaveProperty('analysis')
    expect(nodeDef.analysis).toBe(analysis)

    expect(nodeDef).toHaveProperty('draft')
    expect(nodeDef.draft).toBe(true)

    expect(nodeDef).toHaveProperty('meta')
    expect(nodeDef.meta).toHaveProperty('h')
    const expectedHierarchy: Array<string> = nodeDefParent ? [...nodeDefParent.meta.h, nodeDefParent.uuid] : []
    expect(nodeDef.meta.h.length).toBe(expectedHierarchy.length)
    expect(nodeDef.meta.h).toMatchObject(expectedHierarchy)

    expect(nodeDef).toHaveProperty('parentUuid')
    expect(nodeDef.parentUuid).toBe(nodeDefParent?.uuid)

    expect(nodeDef).toHaveProperty('props')
    expect(nodeDef.props).toHaveProperty('name')
    expect(nodeDef.props.name).toBe(props?.name)
    expect(nodeDef.props).toHaveProperty('multiple')
    expect(nodeDef.props.multiple).toBe(props?.multiple)

    expect(nodeDef).toHaveProperty('propsAdvanced')
    expect(nodeDef.propsAdvanced).toBeUndefined()

    expect(nodeDef).toHaveProperty('published')
    expect(nodeDef.published).toBe(false)

    expect(nodeDef).toHaveProperty('temporary')
    expect(nodeDef.temporary).toBe(true)

    expect(nodeDef).toHaveProperty('type')
    expect(nodeDef.type).toBe(type)

    expect(nodeDef).toHaveProperty('virtual')
    expect(nodeDef.virtual).toBe(virtual)
  })

describe('NodeDefFactory', () => {
  testNodeDef(cluster, clusterParams)
  testNodeDef(dbh, dbhParams)
})
