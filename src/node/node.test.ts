import { describe, test, expect } from '@jest/globals'

import { NodeFactory, NodeFactoryParams, NodePlaceholderFactory } from './factory'
import { Node } from './node'
import { Nodes } from './nodes'

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

  const expectedHierarchy = [
    ...(nodeParams.parentNode?.meta?.h ?? []),
    ...(nodeParams.parentNode?.uuid ? [nodeParams.parentNode?.uuid] : []),
  ]
  const nodeHierarchy = [...(node.meta?.h ?? [])]
  expect(nodeHierarchy).toHaveLength(expectedHierarchy.length)
  expect(nodeHierarchy).toMatchObject(expectedHierarchy)
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

  test('createInstence - parent node', () => {
    const nodeParams: NodeFactoryParams = {
      nodeDefUuid: 'nodedef-uuid-0001-test',
      recordUuid: 'record-uuid-0001-test',
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

describe('Nodes.removeStatusFlags', () => {
  test('sideEffect - clears the flags in place', () => {
    const node: Node = { ...NodeFactory.createInstance({ nodeDefUuid: 'def', recordUuid: 'rec' }), updated: true }
    const nodeUpdated = Nodes.removeStatusFlags({ node, sideEffect: true })
    expect(nodeUpdated).toBe(node)
    expect(nodeUpdated.created).toBeUndefined()
    expect(nodeUpdated.updated).toBeUndefined()
    expect(nodeUpdated.deleted).toBeUndefined()
  })

  test('no sideEffect - returns a new node without the flags', () => {
    const node: Node = { ...NodeFactory.createInstance({ nodeDefUuid: 'def', recordUuid: 'rec' }), updated: true }
    const nodeUpdated = Nodes.removeStatusFlags({ node })
    expect(nodeUpdated).not.toBe(node)
    expect(nodeUpdated).not.toHaveProperty('created')
    expect(nodeUpdated).not.toHaveProperty('updated')
    expect(node.updated).toBe(true)
  })
})
