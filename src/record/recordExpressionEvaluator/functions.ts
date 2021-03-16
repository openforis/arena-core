import { ExpressionFunction } from "../../expression"

export const recordExpressionFunctions: Array<ExpressionFunction> = [
  {
    name: 'index',
    minArity: 1,
    maxArity: 1,
    executor: (node) =>{
      if (!node) {
        return -1
      }
      if (Node.isRoot(node)) {
        return 0
      }
      const nodeParent = Record.getParentNode(node)(record)
      if (!nodeParent) {
        return -1
      }
      const children = Record.getNodeChildrenByDefUuid(nodeParent, Node.getNodeDefUuid(node))(record)
      return children.findIndex(Node.isEqual(node))
    }
  },
  {
    name: 'parent',
    minArity: 1,
    maxArity: 1,
    executor: () => {
      
    }
  }
  [Expression.functionNames.index]: (node) => ,
  [Expression.functionNames.parent]: (node) => {
    if (!node || Node.isRoot(node)) {
      return null
    }
    return Record.getParentNode(node)(record)
  },
})

export const functionsDefault: Array<ExpressionFunction> = [
  {
    name: 'isEmpty',
    minArity: 1,
    maxArity: 1,
    executor: (value: any) => Objects.isEmpty(value),
  },
]
