import { Records } from '../records'
import { Nodes } from '../../node'
import { ExpressionFunctions } from '../../expression'
import { RecordExpressionContext } from './context'
import { nodeDefExpressionFunctions } from '../../nodeDefExpressionEvaluator/functions'
import { Objects } from '../../utils'
import { Surveys } from '../../survey'
import { ExtraProps } from '../../extraProp/extraProps'

export const recordExpressionFunctions: ExpressionFunctions<RecordExpressionContext> = {
  ...nodeDefExpressionFunctions,
  categoryItemProp: {
    minArity: 3,
    executor:
      (context: RecordExpressionContext) =>
      (categoryName: string, itemPropName: string, ...codePaths: string[]) => {
        const { survey } = context
        const category = Surveys.getCategoryByName({ survey, categoryName })
        if (!category) return null

        const extraPropDef = category.props.itemExtraDef?.[itemPropName]
        if (!extraPropDef) return null

        const categoryItem = Surveys.getCategoryItemByCodePaths({ survey, categoryUuid: category.uuid, codePaths })
        if (!categoryItem) return null

        const value = categoryItem.props.extra?.[itemPropName]
        return ExtraProps.convertValue({ survey, extraPropDef, value })
      },
  },
  count: {
    minArity: 1,
    evaluateArgsToNodes: true,
    executor: (_context: RecordExpressionContext) => (nodeSet) => {
      if (!nodeSet) return 0
      if (Array.isArray(nodeSet)) return nodeSet.length
      return 0
    },
  },
  first: {
    minArity: 1,
    maxArity: 1,
    evaluateArgsToNodes: false,
    executor: (_context: RecordExpressionContext) => (nodeSet) => {
      if (nodeSet && Array.isArray(nodeSet) && nodeSet.length > 0) {
        return nodeSet[0]
      }
      return null
    },
  },
  index: {
    minArity: 1,
    maxArity: 1,
    evaluateArgsToNodes: true,
    executor: (context: RecordExpressionContext) => (node) => {
      if (!node) {
        return -1
      }
      if (Nodes.isRoot(node)) {
        return 0
      }
      const { record } = context
      const parentNode = Records.getParent(node)(record)
      if (!parentNode) {
        return -1
      }
      const children = Records.getChildren(parentNode, node.nodeDefUuid)(record)
      return children.findIndex((n) => Nodes.areEqual(n, node))
    },
  },
  last: {
    minArity: 1,
    maxArity: 1,
    evaluateArgsToNodes: false,
    executor: (_context: RecordExpressionContext) => (nodeSet) => {
      if (nodeSet && Array.isArray(nodeSet) && nodeSet.length > 0) {
        return nodeSet[nodeSet.length - 1]
      }
      return null
    },
  },
  parent: {
    minArity: 1,
    maxArity: 1,
    evaluateArgsToNodes: true,
    evaluateToNode: true,
    executor: (context: RecordExpressionContext) => (node) => {
      if (!node || Nodes.isRoot(node)) {
        return null
      }
      const { record } = context
      return Records.getParent(node)(record)
    },
  },
  sum: {
    minArity: 1,
    maxArity: 1,
    evaluateArgsToNodes: false,
    executor: (_context: RecordExpressionContext) => (nodeSet) => {
      if (!nodeSet) return 0
      if (Array.isArray(nodeSet)) return nodeSet.reduce((acc, value) => acc + (Number(value) || 0), 0)
      return 0
    },
  },
  taxonProp: {
    minArity: 3,
    maxArity: 3,
    executor: (context: RecordExpressionContext) => (taxonomyName: string, propName: string, taxonCode: string) => {
      const { survey } = context

      if (
        Objects.isEmpty(taxonomyName) ||
        Objects.isEmpty(propName) ||
        Objects.isEmpty(taxonCode) ||
        typeof taxonCode !== 'string' // node def expression validator could call it passing a node def object
      )
        return null

      const taxonomy = Surveys.getTaxonomyByName({ survey, taxonomyName })
      if (!taxonomy) return null

      const extraPropDef = taxonomy.props.extraPropsDefs?.[propName]
      if (!extraPropDef) return null

      const taxon = Surveys.getTaxonByCode({ survey, taxonomyUuid: taxonomy.uuid, taxonCode })
      if (!taxon) return null

      const value = taxon.props.extra?.[propName]
      return ExtraProps.convertValue({ survey, extraPropDef, value })
    },
  },
}
