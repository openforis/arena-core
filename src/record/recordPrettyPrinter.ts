import { Dictionary, TraverseMethod } from '../common'
import { Node, NodeValueFormatter, Nodes } from '../node'
import { NodeDefs } from '../nodeDef'
import { Survey, Surveys } from '../survey'
import { Strings } from '../utils'
import { Record } from './record'
import * as RecordGetters from './_records/recordGetters'

type PrintOptions = {
  showNotApplicable?: boolean
  showNotEditable?: boolean
  showNotVisible?: boolean
}

const DefaultPrintOptions: PrintOptions = {
  showNotApplicable: false,
  showNotEditable: false,
  showNotVisible: false,
}

const print = (params: { survey: Survey; record: Record; options?: PrintOptions }): string => {
  const { survey, record, options = DefaultPrintOptions } = params
  const { showNotApplicable, showNotEditable, showNotVisible } = options

  const cycle = record.cycle!
  const rootNode = RecordGetters.getRoot(record)
  if (!rootNode) {
    return ''
  }

  const parts: string[] = []
  RecordGetters.visitDescendantsAndSelf({
    record,
    node: rootNode,
    visitor: (node) => {
      const { nodeDefUuid } = node
      const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: nodeDefUuid })
      const value = NodeValueFormatter.format({ survey, cycle, nodeDef, node, value: node.value })
      const depth = Nodes.getHierarchy(node).length
      const indentation = Strings.repeat(' ', depth)
      let part = `${indentation}${NodeDefs.getName(nodeDef)}: ${value}`
      const infoParts: string[] = []
      const parentNode = NodeDefs.isRoot(nodeDef) ? null : RecordGetters.getParent(node)(record)
      if (parentNode) {
        if (showNotApplicable && !Nodes.isChildApplicable(parentNode, nodeDefUuid)) {
          infoParts.push('not applicable')
        }
        if (showNotEditable && !Nodes.isChildEditable(parentNode, nodeDefUuid)) {
          infoParts.push('not editable')
        }
        if (showNotVisible && !Nodes.isChildVisible(parentNode, nodeDefUuid)) {
          infoParts.push('not visible')
        }
      }
      if (infoParts.length > 0) {
        part += ` (${infoParts.join(', ')})`
      }
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
