import { Node } from '../node'
import { NodeDef, NodeDefs } from '../nodeDef'
import { Record, Records } from '../record'
import { Survey, Surveys } from '../survey'
import { Arrays } from '../utils'

const findNodeDefByName = (params: { survey: Survey; name: string }): NodeDef<any> | undefined => {
  const { survey, name } = params
  try {
    return Surveys.getNodeDefByName({ survey, name })
  } catch (error) {
    return undefined
  }
}

const findNodesByPath = (params: { survey: Survey; record: Record; path: string }): Node[] | undefined => {
  const { survey, record, path } = params
  const root = Records.getRoot(record)
  if (!root) throw new Error('Cannot find root node')

  let currentNodes: Node[] = [root]

  const pathParts = path.split('.')
  for (let index = 0; index < pathParts.length; index++) {
    const pathPart = pathParts[index]
    const partMatch = /(\w+)(\[(\d+)\])?/.exec(pathPart)
    if (!partMatch) return undefined

    const childName = partMatch[1]
    const childDef = findNodeDefByName({ survey, name: childName })
    if (!childDef) return undefined

    if (index === 0 && !childDef.parentUuid) {
      // skip root
    } else {
      const currentNode = currentNodes[0]
      if (!currentNode) return undefined
      const singleDef = NodeDefs.isSingle(childDef)
      const children = Records.getChildren(currentNode, childDef.uuid)(record)
      const childIndex = Number(partMatch[3] || (singleDef ? 0 : null))
      const child = childIndex >= 0 ? children[childIndex] : null
      if (singleDef && !child) return undefined
      currentNodes = childIndex ? Arrays.toArray(child) : children
    }
  }
  return currentNodes
}

const findNodeByPath = (params: { survey: Survey; record: Record; path: string }): Node | undefined => {
  const nodes = findNodesByPath(params)
  return nodes?.[0]
}

const getNodeByPath = (params: { survey: Survey; record: Record; path: string }): Node => {
  const node = findNodeByPath(params)
  if (!node) throw new Error(`Cannot find node at path ${params.path}`)
  return node
}

const getNodeUuidByPath = (params: { survey: Survey; record: Record; path: string }): string =>
  getNodeByPath(params).uuid

const getNodeName =
  (params: { survey: Survey }) =>
  (node: Node): string => {
    const { survey } = params
    return NodeDefs.getName(Surveys.getNodeDefByUuid({ survey, uuid: node.nodeDefUuid }))
  }

const getCategoryItem = (params: { survey: Survey; categoryName: string; codePaths: string[] }) => {
  const { survey, categoryName, codePaths } = params
  const category = Surveys.getCategoryByName({ survey, categoryName })
  if (!category) throw new Error(`Could not find category ${categoryName}`)

  const item = Surveys.getCategoryItemByCodePaths({
    survey,
    categoryUuid: category.uuid,
    codePaths,
  })
  if (!item) throw new Error(`Could not find category item ${codePaths}`)
  return item
}

export const TestUtils = {
  findNodesByPath,
  findNodeByPath,
  getNodeByPath,
  getNodeUuidByPath,
  getNodeName,
  getCategoryItem,
}
