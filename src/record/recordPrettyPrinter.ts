import { Dictionary, TraverseMethod } from '../common'
import { Node, NodeValueFormatter, Nodes } from '../node'
import { NodeDefs } from '../nodeDef'
import { Survey, Surveys } from '../survey'
import { Strings } from '../utils'
import { Record } from './record'
import * as RecordGetters from './_records/recordGetters'

type PrintOptions = {
  includeEmptyNodes?: boolean
  showNotApplicable?: boolean
  showNotEditable?: boolean
  showNotVisible?: boolean
}

const DefaultPrintOptions: PrintOptions = {
  includeEmptyNodes: false,
  showNotApplicable: false,
  showNotEditable: false,
  showNotVisible: false,
}

const print = (params: { survey: Survey; record: Record; options?: PrintOptions }): string => {
  const { survey, record, options = DefaultPrintOptions } = params
  const { includeEmptyNodes, showNotApplicable, showNotEditable, showNotVisible } = options

  const cycle = RecordGetters.getCycle(record)
  const rootNode = RecordGetters.getRoot(record)
  if (!rootNode) {
    return ''
  }

  const getInfoParts = (params: { parentNode?: Node | null; childDefUuid: string }): string[] => {
    const { parentNode, childDefUuid } = params
    if (!parentNode) {
      return []
    }
    const infoParts: string[] = []
    if (showNotApplicable && !Nodes.isChildApplicable(parentNode, childDefUuid)) {
      infoParts.push('not applicable')
    }
    if (showNotEditable && !Nodes.isChildEditable(parentNode, childDefUuid)) {
      infoParts.push('not editable')
    }
    if (showNotVisible && !Nodes.isChildVisible(parentNode, childDefUuid)) {
      infoParts.push('not visible')
    }
    return infoParts
  }

  const toPart = (params: { depth: number; name: string; value: string; infoParts?: string[] }): string => {
    const { depth, name, value, infoParts = [] } = params
    const indentation = Strings.repeat(' ', depth)
    let part = `${indentation}${name}: ${value}`
    if (infoParts.length > 0) {
      part += ` (${infoParts.join(', ')})`
    }
    return part
  }

  const parts: string[] = []

  if (includeEmptyNodes) {
    const printNodeAndChildren = (params: { node: Node; parentNode: Node | null }): void => {
      const { node, parentNode } = params
      const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: node.nodeDefUuid })
      const value = NodeValueFormatter.format({ survey, cycle, nodeDef, node, value: node.value })
      const depth = Nodes.getHierarchy(node).length
      const infoParts = getInfoParts({ parentNode, childDefUuid: node.nodeDefUuid })
      parts.push(toPart({ depth, name: NodeDefs.getName(nodeDef), value, infoParts }))

      const childDefs = Surveys.getNodeDefChildrenSorted({ survey, nodeDef, cycle })
      childDefs.forEach((childDef) => {
        const children = RecordGetters.getChildren(node, childDef.uuid)(record)
        if (children.length === 0) {
          const childInfoParts = getInfoParts({ parentNode: node, childDefUuid: childDef.uuid })
          parts.push(
            toPart({
              depth: depth + 1,
              name: NodeDefs.getName(childDef),
              value: '<empty>',
              infoParts: childInfoParts,
            })
          )
          return
        }
        children.forEach((child) => printNodeAndChildren({ node: child, parentNode: node }))
      })
    }

    printNodeAndChildren({ node: rootNode, parentNode: null })
    return parts.join('\n')
  }

  RecordGetters.visitDescendantsAndSelf({
    record,
    node: rootNode,
    visitor: (node) => {
      const { nodeDefUuid } = node
      const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: nodeDefUuid })
      const value = NodeValueFormatter.format({ survey, cycle, nodeDef, node, value: node.value })
      const depth = Nodes.getHierarchy(node).length
      const parentNode = NodeDefs.isRoot(nodeDef) ? null : RecordGetters.getParent(node)(record)
      const infoParts = getInfoParts({ parentNode, childDefUuid: nodeDefUuid })
      parts.push(toPart({ depth, name: NodeDefs.getName(nodeDef), value, infoParts }))
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
