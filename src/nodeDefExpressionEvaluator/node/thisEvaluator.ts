import { CategoryItemGenerator } from '../../category/categoryItemGenerator'
import { ThisEvaluator } from '../../expression/javascript/node/this'
import { NodeDefType } from '../../nodeDef/nodeDef'
import { NodeDefs } from '../../nodeDef/nodeDefs'
import { NodeDefCode } from '../../nodeDef/types/code'
import { NodeDefTaxon } from '../../nodeDef/types/taxon'
import { TaxonGenerator } from '../../taxonomy/taxonGenerator'
import { NodeDefExpressionContext } from '../context'

export class NodeDefThisEvaluator extends ThisEvaluator<NodeDefExpressionContext> {
  async evaluate(): Promise<any> {
    const { nodeDefCurrent, itemsFilter, currentExpressionPath } = this.context

    // Set path to 'this' when it appears standalone (e.g., as argument to parent(this))
    // For member expressions like 'this.height', the member evaluator will handle the path
    if (!currentExpressionPath) {
      this.context.currentExpressionPath = 'this'
    }

    return itemsFilter ? this.createEmptyItem() : nodeDefCurrent
  }

  createEmptyItem() {
    const { survey, nodeDefCurrent } = this.context
    if (!nodeDefCurrent) return null

    if (nodeDefCurrent.type === NodeDefType.code) {
      const categoryUuid = NodeDefs.getCategoryUuid(nodeDefCurrent as NodeDefCode)
      return categoryUuid ? CategoryItemGenerator.generateItem({ survey, categoryUuid }) : null
    }
    if (nodeDefCurrent.type === NodeDefType.taxon) {
      const taxonomyUuid = NodeDefs.getTaxonomyUuid(nodeDefCurrent as NodeDefTaxon)
      return taxonomyUuid ? TaxonGenerator.generateTaxon({ survey, taxonomyUuid }) : null
    }
    return null
  }
}
