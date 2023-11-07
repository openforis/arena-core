import { NodeValueFormatter, Nodes } from '../node'
import { NodeDefs } from '../nodeDef'
import { Survey, Surveys } from '../survey'
import { Strings } from '../utils'
import { Record } from './record'
import * as RecordGetters from './_records/recordGetters'
import { TraverseMethod } from '../common'

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
    },
    traverseMethod: TraverseMethod.dfs,
  })
  return parts.join('\n')
}

export const RecordPrettyPrinter = {
  print,
}
