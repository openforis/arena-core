import { Dictionary, TraverseMethod } from '../common'
import { Node, NodeValueFormatter, Nodes } from '../node'
import { NodeDefs } from '../nodeDef'
import { Survey, Surveys } from '../survey'
import { Strings } from '../utils'
import { Record } from './record'
import * as RecordGetters from './_records/recordGetters'

const print = (params: { survey: Survey; record: Record }): string => {
  const { survey, record } = params

  const cycle = record.cycle!
  const rootNode = RecordGetters.getRoot(record)!

  const parts: string[] = []
  RecordGetters.visitDescendantsAndSelf({
    record,
    node: rootNode,
    visitor: (node) => {
      const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: node.nodeDefUuid })
      const value = NodeValueFormatter.format({ survey, cycle, nodeDef, node, value: node.value })
      const depth = Nodes.getHierarchy(node).length
      const indentation = Strings.repeat(' ', depth)
      const part = `${indentation}${NodeDefs.getName(nodeDef)}: ${value}`
      parts.push(part)
      return false
    },
    traverseMethod: TraverseMethod.dfs,
  })
  return parts.join('\n')
}

const printNodePath = (params: { survey: Survey; record: Record; node: Node }): string => {
  const { survey, record, node } = params
  const parts: string[] = []
  RecordGetters.visitAncestorsAndSelf(node, (visitedNode) => {
    const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: visitedNode.nodeDefUuid })
    let part = NodeDefs.getName(nodeDef)
    if (NodeDefs.isMultiple(nodeDef)) {
      const index = RecordGetters.getNodeIndex({ record, node: visitedNode })
      part = `${part}[${index}]`
    }
    parts.unshift(part)
  })(record)
  return parts.join('.')
}

const printNodesPaths = (params: { survey: Survey; record: Record; nodes: Dictionary<Node> }): string[] => {
  const { survey, record, nodes } = params
  return Object.values(nodes).map((node) => RecordPrettyPrinter.printNodePath({ survey, record, node }))
}

export const RecordPrettyPrinter = {
  print,
  printNodePath,
  printNodesPaths,
}
