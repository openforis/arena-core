import { NodeFactory, NodeFactoryParams, NodePlaceholderFactory } from './factory'
import { Node } from './node'

const checkNode = (node: Node, nodeParams: NodeFactoryParams) => {
  expect(node).toHaveProperty('uuid')
  expect(node).toHaveProperty('nodeDefUuid')
  expect(node.nodeDefUuid).toBe(nodeParams.nodeDefUuid)
  expect(node).toHaveProperty('recordUuid')
  expect(node.recordUuid).toBe(nodeParams.recordUuid)
  expect(node).toHaveProperty('parentUuid')
  expect(node.parentUuid).toBe(nodeParams.parentNode?.uuid)

  expect(node).toHaveProperty('value')
  expect(node.value).toBe(nodeParams.value)

  expect(node).toHaveProperty('value')
  expect(node.value).toBe(nodeParams.value)

  expect(node).toHaveProperty('meta')
  expect(node.meta).toHaveProperty('h')
  const expectedHierarchy = [...(nodeParams.parentNode?.meta?.h || []), nodeParams.parentNode?.uuid]
  expect(node.meta.h.length).toBe(expectedHierarchy.length)
  expect([...node.meta.h]).toMatchObject(expectedHierarchy)
}

describe('NodeFactory', () => {
  test('createInstence - node', () => {
    const nodeParams: NodeFactoryParams = {
      nodeDefUuid: 'nodedef-uuid-0001-test',
      recordUuid: 'record-uuid-0001-test',
      parentNode: {
        uuid: 'parent-node-uuid',
        nodeDefUuid: 'nodeDefUuid',
        recordUuid: 'nodeDefUuid',
        meta: {
          h: ['uuid-prev'],
        },
      },
      value: 'VALUE',
    }

    const node = NodeFactory.createInstance(nodeParams)
    checkNode(node, nodeParams)
  })

  test('createInstence - placeholder', () => {
    const nodeParams: NodeFactoryParams = {
      nodeDefUuid: 'nodedef-uuid-0001-test',
      recordUuid: 'record-uuid-0001-test',
      parentNode: {
        uuid: 'parent-node-uuid',
        nodeDefUuid: 'nodeDefUuid',
        recordUuid: 'nodeDefUuid',
        meta: {
          h: ['uuid-prev'],
        },
      },
      value: 'VALUE',
    }

    const node = NodePlaceholderFactory.createInstance(nodeParams)
    checkNode(node, nodeParams)
    expect(node).toHaveProperty('placeholder')
    expect(node.placeholder).toBeTruthy()
  })
})
