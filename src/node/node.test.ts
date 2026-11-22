import { describe, test, expect } from '@jest/globals'

import { NodeDefFactory, NodeDefType, ArenaNodeDefValidations } from '../nodeDef'
import { RecordNodeFactory, NodeFactoryParams } from './factory'
import { ArenaRecordNode } from './node'
import { RecordNodes } from './nodes'

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

  // the hierarchy is derived from the parent uuids: it's not stored in the node meta
  expect(node.meta).toEqual({})
}

describe('RecordNodeFactory', () => {
  test('createInstence - node', () => {
    const nodeParams: NodeFactoryParams = {
      nodeDefUuid: 'nodedef-uuid-0001-test',
      recordUuid: 'record-uuid-0001-test',
      parentNode: {
        uuid: 'parent-node-uuid',
        nodeDefUuid: 'nodeDefUuid',
        recordUuid: 'nodeDefUuid',
      },
      value: 'VALUE',
    }

    const node = RecordNodeFactory.createInstance(nodeParams)
    checkNode(node, nodeParams)
  })

  test('createInstence - parent node', () => {
    const nodeParams: NodeFactoryParams = {
      nodeDefUuid: 'nodedef-uuid-0001-test',
      recordUuid: 'record-uuid-0001-test',
      value: 'VALUE',
    }

    const node = RecordNodeFactory.createInstance(nodeParams)
    checkNode(node, nodeParams)
  })
})

describe('RecordNodes.removeStatusFlags', () => {
  test('sideEffect - clears the flags in place', () => {
    const node: ArenaRecordNode = {
      ...RecordNodeFactory.createInstance({ nodeDefUuid: 'def', recordUuid: 'rec' }),
      updated: true,
    }
    const nodeUpdated = RecordNodes.removeStatusFlags({ node, sideEffect: true })
    expect(nodeUpdated).toBe(node)
    expect(nodeUpdated.created).toBeUndefined()
    expect(nodeUpdated.updated).toBeUndefined()
    expect(nodeUpdated.deleted).toBeUndefined()
  })

  test('no sideEffect - returns a new node without the flags', () => {
    const node: ArenaRecordNode = {
      ...RecordNodeFactory.createInstance({ nodeDefUuid: 'def', recordUuid: 'rec' }),
      updated: true,
    }
    const nodeUpdated = RecordNodes.removeStatusFlags({ node })
    expect(nodeUpdated).not.toBe(node)
    expect(nodeUpdated).not.toHaveProperty('created')
    expect(nodeUpdated).not.toHaveProperty('updated')
    expect(node.updated).toBe(true)
  })
})

describe('RecordNodes mutation options', () => {
  const createNode = (): ArenaRecordNode => RecordNodeFactory.createInstance({ nodeDefUuid: 'def', recordUuid: 'rec' })

  test('assocValue copies the node by default', () => {
    const node = createNode()
    const nodeUpdated = RecordNodes.assocValue(node, 'a')
    expect(nodeUpdated).not.toBe(node)
    expect(nodeUpdated.value).toBe('a')
    expect(node.value).toBeUndefined()
  })

  test('assocValue modifies the node in place with { sideEffect: true }', () => {
    const node = createNode()
    const nodeUpdated = RecordNodes.assocValue(node, 'a', { sideEffect: true })
    expect(nodeUpdated).toBe(node)
    expect(node.value).toBe('a')
  })

  test('assocChildEditable and assocChildVisible accept options', () => {
    const node = createNode()
    const nodeNotEditable = RecordNodes.assocChildEditable(node, 'child', false)
    expect(nodeNotEditable).not.toBe(node)
    expect(RecordNodes.isChildEditable(nodeNotEditable, 'child')).toBe(false)
    expect(RecordNodes.assocChildEditable(node, 'child', false, { sideEffect: true })).toBe(node)
    expect(RecordNodes.assocChildVisible(node, 'child', false, { sideEffect: true })).toBe(node)
    expect(RecordNodes.isChildVisible(node, 'child')).toBe(false)
    expect(RecordNodes.assocChildVisible(node, 'child', true, { sideEffect: true })).toBe(node)
    expect(RecordNodes.isChildVisible(node, 'child')).toBe(true)
  })
})

describe('RecordNodes.getChildrenMinCount / getChildrenMaxCount', () => {
  const parentNode = RecordNodeFactory.createInstance({ nodeDefUuid: 'parentDef', recordUuid: 'rec' })
  const createNodeDef = (count: ArenaNodeDefValidations['count']) =>
    NodeDefFactory.createInstance({ type: NodeDefType.entity, propsAdvanced: { validations: { count } } })

  test('constant counts are converted to numbers', () => {
    const nodeDef = createNodeDef({ min: '1', max: '3' })
    expect(RecordNodes.getChildrenMinCount({ parentNode, nodeDef })).toBe(1)
    expect(RecordNodes.getChildrenMaxCount({ parentNode, nodeDef })).toBe(3)
  })

  test('empty or not evaluated count expressions are NaN', () => {
    const nodeDef = createNodeDef({ min: '1', max: [] })
    expect(RecordNodes.getChildrenMinCount({ parentNode, nodeDef })).toBe(1)
    expect(RecordNodes.getChildrenMaxCount({ parentNode, nodeDef })).toBeNaN()
    const nodeDefWithExpression = createNodeDef({
      min: [{ uuid: 'expr1', expression: '2' }],
      max: [{ uuid: 'expr1', expression: '2' }],
    })
    expect(RecordNodes.getChildrenMinCount({ parentNode, nodeDef: nodeDefWithExpression })).toBeNaN()
    expect(RecordNodes.getChildrenMaxCount({ parentNode, nodeDef: nodeDefWithExpression })).toBeNaN()
  })
})
