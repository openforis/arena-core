import { NodeDefFactory, NodeDefFactoryParams } from './factory'
import { NodeDefType } from './nodeDef'

describe('NodeDefFactory', () => {
  test('createInstence - nodeDef', () => {
    const nodeDefParams: NodeDefFactoryParams = {
      type: NodeDefType.text,
      props: {
        name: 'Name',
        multiple: false,
      },
      analysis: true,
      virtual: true,
    }

    const nodeDef = NodeDefFactory.createInstance(nodeDefParams)

    expect(nodeDef).toHaveProperty('analysis')
    expect(nodeDef.analysis).toBe(true)

    expect(nodeDef).toHaveProperty('draft')
    expect(nodeDef.draft).toBe(true)

    expect(nodeDef).toHaveProperty('meta')
    expect(nodeDef.meta).toHaveProperty('h')
    const expectedHierarchy = [
      ...(nodeDefParams.nodeDefParent?.meta?.h || []),
      ...(nodeDefParams.nodeDefParent?.uuid || []),
    ]
    expect((nodeDef?.meta?.h || []).length).toBe(expectedHierarchy.length)
    expect([...(nodeDef?.meta?.h || [])]).toMatchObject(expectedHierarchy)

    expect(nodeDef).toHaveProperty('parentUuid')
    expect(nodeDef.parentUuid).toBe(nodeDefParams.nodeDefParent?.uuid)

    expect(nodeDef).toHaveProperty('props')
    expect(nodeDef.props).toHaveProperty('name')
    expect(nodeDef.props.name).toBe(nodeDefParams?.props?.name)
    expect(nodeDef.props).toHaveProperty('multiple')
    expect(nodeDef.props.multiple).toBe(false)

    expect(nodeDef).toHaveProperty('propsAdvanced')
    expect(nodeDef.propsAdvanced).toBeUndefined()

    expect(nodeDef).toHaveProperty('published')
    expect(nodeDef.published).toBe(false)

    expect(nodeDef).toHaveProperty('temporary')
    expect(nodeDef.temporary).toBe(true)

    expect(nodeDef).toHaveProperty('type')
    expect(nodeDef.type).toBe(nodeDefParams.type)

    expect(nodeDef).toHaveProperty('virtual')
    expect(nodeDef.virtual).toBe(true)
  })
})
