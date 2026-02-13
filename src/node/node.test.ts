import { RecordFactory } from '../record'
import { NodeFactory, NodeFactoryParams, NodePlaceholderFactory } from './factory'
import { Node } from './node'
import { createTestAdminUser } from '../tests/data'

const user = createTestAdminUser()

const checkNode = (node: Node, nodeParams: NodeFactoryParams) => {
  expect(node).toHaveProperty('iId')
  expect(node).toHaveProperty('nodeDefUuid')
  expect(node.nodeDefUuid).toBe(nodeParams.nodeDefUuid)
  expect(node).toHaveProperty('recordUuid')
  expect(node.recordUuid).toBe(nodeParams.record.uuid)
  expect(node).toHaveProperty('pIId')
  expect(node.pIId).toBe(nodeParams.parentNode?.iId)

  expect(node).toHaveProperty('value')
  expect(node.value).toBe(nodeParams.value)

  expect(node).toHaveProperty('value')
  expect(node.value).toBe(nodeParams.value)

  expect(node).toHaveProperty('meta')
  expect(node.meta).toHaveProperty('h')

  const expectedHierarchy = [
    ...(nodeParams.parentNode?.meta?.h ?? []),
    ...(nodeParams.parentNode?.iId ? [nodeParams.parentNode.iId] : []),
  ]
  const nodeHierarchy = [...(node.meta?.h ?? [])]
  expect(nodeHierarchy.length).toBe(expectedHierarchy.length)
  expect(nodeHierarchy).toMatchObject(expectedHierarchy)
}

describe('NodeFactory', () => {
  test('createInstence - node', () => {
    const record = RecordFactory.createInstance({ surveyUuid: 'survey-uuid', user })
    const nodeParams: NodeFactoryParams = {
      nodeDefUuid: 'nodedef-uuid-0001-test',
      record,
      parentNode: {
        iId: 2,
        nodeDefUuid: 'nodeDefUuid',
        recordUuid: 'nodeDefUuid',
        meta: {
          h: [1],
        },
      },
      value: 'VALUE',
    }

    const node = NodeFactory.createInstance(nodeParams)
    checkNode(node, nodeParams)
  })

  test('createInstence - parent node', () => {
    const record = RecordFactory.createInstance({ surveyUuid: 'survey-uuid', user })
    const nodeParams: NodeFactoryParams = {
      nodeDefUuid: 'nodedef-uuid-0001-test',
      record,
      value: 'VALUE',
    }

    const node = NodeFactory.createInstance(nodeParams)
    checkNode(node, nodeParams)
  })

  test('createInstence - placeholder', () => {
    const record = RecordFactory.createInstance({ surveyUuid: 'survey-uuid', user })
    const nodeParams: NodeFactoryParams = {
      nodeDefUuid: 'nodedef-uuid-0001-test',
      record,
      parentNode: {
        iId: 3,
        nodeDefUuid: 'nodeDefUuid',
        recordUuid: 'nodeDefUuid',
        meta: {
          h: [2],
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
