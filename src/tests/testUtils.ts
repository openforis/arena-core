import { Node } from '../node'
import { Record, Records } from '../record'
import { Survey, Surveys } from '../survey'

const getNodeByPath = (params: { survey: Survey; record: Record; path: string }): Node => {
  const { survey, record, path } = params
  const root = Records.getRoot(record)
  if (!root) throw new Error('Cannot find root node')

  let currentNode: Node = root

  path.split('.').forEach((pathPart, index) => {
    const partMatch = /(\w+)(\[(\d+)\])?/.exec(pathPart)
    if (!partMatch) throw new Error(`invalid syntax for path part: ${pathPart}`)

    const childName = partMatch[1]
    const childDef = Surveys.getNodeDefByName({ survey, name: childName })
    if (index === 0 && !childDef.parentUuid) {
      // skip root
    } else {
      const childIndex = Number(partMatch[3] || 0)
      const children = Records.getChildren(currentNode, childDef.uuid)(record)
      const child = children[childIndex]
      if (!child) throw new Error(`Cannot find node at path ${path}`)

      currentNode = child
    }
  })
  return currentNode
}

export const TestUtils = {
  getNodeByPath,
}
