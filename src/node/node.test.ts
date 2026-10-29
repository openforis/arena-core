import { describe, test, expect } from '@jest/globals'

import { NodeDefFactory, NodeDefType, NodeDefValidations } from '../nodeDef'
import { NodeFactory, NodeFactoryParams } from './factory'
import { ArenaRecordNode } from './node'
import { Nodes } from './nodes'

const checkNode = (node: ArenaRecordNode, nodeParams: NodeFactoryParams) => {
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
})

describe('Nodes.removeStatusFlags', () => {
  test('sideEffect - clears the flags in place', () => {
    const node: ArenaRecordNode = {
      ...NodeFactory.createInstance({ nodeDefUuid: 'def', recordUuid: 'rec' }),
      updated: true,
    }
    const nodeUpdated = Nodes.removeStatusFlags({ node, sideEffect: true })
    expect(nodeUpdated).toBe(node)
    expect(nodeUpdated.created).toBeUndefined()
    expect(nodeUpdated.updated).toBeUndefined()
    expect(nodeUpdated.deleted).toBeUndefined()
  })

  test('no sideEffect - returns a new node without the flags', () => {
    const node: ArenaRecordNode = {
      ...NodeFactory.createInstance({ nodeDefUuid: 'def', recordUuid: 'rec' }),
      updated: true,
    }
    const nodeUpdated = Nodes.removeStatusFlags({ node })
    expect(nodeUpdated).not.toBe(node)
    expect(nodeUpdated).not.toHaveProperty('created')
    expect(nodeUpdated).not.toHaveProperty('updated')
    expect(node.updated).toBe(true)
  })
})

describe('Nodes mutation options', () => {
  const createNode = (): ArenaRecordNode => NodeFactory.createInstance({ nodeDefUuid: 'def', recordUuid: 'rec' })

  test('assocValue copies the node by default', () => {
    const node = createNode()
    const nodeUpdated = Nodes.assocValue(node, 'a')
    expect(nodeUpdated).not.toBe(node)
    expect(nodeUpdated.value).toBe('a')
    expect(node.value).toBeUndefined()
  })

  test('assocValue modifies the node in place with { sideEffect: true }', () => {
    const node = createNode()
    const nodeUpdated = Nodes.assocValue(node, 'a', { sideEffect: true })
    expect(nodeUpdated).toBe(node)
    expect(node.value).toBe('a')
  })

  test('assocValue still accepts the deprecated positional sideEffect', () => {
    const node = createNode()
    expect(Nodes.assocValue(node, 'a', true)).toBe(node)
    expect(Nodes.assocValue(node, 'b', false)).not.toBe(node)
  })

  test('assocChildEditable and assocChildVisible accept options and the deprecated positional sideEffect', () => {
    const node = createNode()
    const nodeNotEditable = Nodes.assocChildEditable(node, 'child', false)
    expect(nodeNotEditable).not.toBe(node)
    expect(Nodes.isChildEditable(nodeNotEditable, 'child')).toBe(false)
    expect(Nodes.assocChildEditable(node, 'child', false, { sideEffect: true })).toBe(node)
    expect(Nodes.assocChildVisible(node, 'child', false, { sideEffect: true })).toBe(node)
    expect(Nodes.isChildVisible(node, 'child')).toBe(false)
    expect(Nodes.assocChildVisible(node, 'child', true, true)).toBe(node)
    expect(Nodes.isChildVisible(node, 'child')).toBe(true)
  })
})

describe('Nodes.getChildrenMinCount / getChildrenMaxCount', () => {
  const parentNode = NodeFactory.createInstance({ nodeDefUuid: 'parentDef', recordUuid: 'rec' })
  const createNodeDef = (count: NodeDefValidations['count']) =>
    NodeDefFactory.createInstance({ type: NodeDefType.entity, propsAdvanced: { validations: { count } } })

  test('constant counts are converted to numbers', () => {
    const nodeDef = createNodeDef({ min: '1', max: '3' })
    expect(Nodes.getChildrenMinCount({ parentNode, nodeDef })).toBe(1)
    expect(Nodes.getChildrenMaxCount({ parentNode, nodeDef })).toBe(3)
  })

  test('empty or not evaluated count expressions are NaN', () => {
    const nodeDef = createNodeDef({ min: '1', max: [] })
    expect(Nodes.getChildrenMinCount({ parentNode, nodeDef })).toBe(1)
    expect(Nodes.getChildrenMaxCount({ parentNode, nodeDef })).toBeNaN()
    const nodeDefWithExpression = createNodeDef({
      min: [{ uuid: 'expr1', expression: '2' }],
      max: [{ uuid: 'expr1', expression: '2' }],
    })
    expect(Nodes.getChildrenMinCount({ parentNode, nodeDef: nodeDefWithExpression })).toBeNaN()
    expect(Nodes.getChildrenMaxCount({ parentNode, nodeDef: nodeDefWithExpression })).toBeNaN()
  })
})
