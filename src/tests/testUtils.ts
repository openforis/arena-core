import { Node } from '../node'
import { Record, Records } from '../record'
import { Survey, Surveys } from '../survey'

const getNodeByPath = (params: { survey: Survey; record: Record; path: string }): Node => {
  const { survey, record, path } = params
  let currentNode = Records.getRoot(record)
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
      currentNode = children[childIndex]
    }
  })
  if (!currentNode) throw new Error(`Cannot find node with path ${path}`)
  return currentNode
}

export const TestUtils = {
  getNodeByPath,
}
