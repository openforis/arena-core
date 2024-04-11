import { CategoryItemGenerator } from '../../category/categoryItemGenerator'
import { ThisEvaluator } from '../../expression/javascript/node/this'
import { NodeDefType } from '../../nodeDef/nodeDef'
import { NodeDefs } from '../../nodeDef/nodeDefs'
import { NodeDefCode } from '../../nodeDef/types/code'
import { NodeDefTaxon } from '../../nodeDef/types/taxon'
import { TaxonGenerator } from '../../taxonomy/taxonGenerator'
import { NodeDefExpressionContext } from '../context'

export class NodeDefThisEvaluator extends ThisEvaluator<NodeDefExpressionContext> {
  evaluate(): any {
    const { nodeDefCurrent, itemsFilter } = this.context

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
