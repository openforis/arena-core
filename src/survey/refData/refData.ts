import { CategoryItem } from '../../category'
import { Taxon } from '../../taxonomy'

/**
 * Cache of reference data items (category items and taxa).
 */
export interface SurveyRefData {
  /**
   * Category item UUIDs indexed by category UUID, parent item UUID and code.
   */
  categoryItemUuidIndex: { [categoryUuid: string]: { [parentItemUuid: string]: { [code: string]: string } } }
  /**
   * Category items indexed by item UUID.
   */
  categoryItemIndex: { [categoryItemUuid: string]: CategoryItem }
  /**
   * Taxa indexed by taxonomy UUID and taxon code.
   */
  taxonUuidIndex: { [taxonomyUuid: string]: { [taxonCode: string]: Taxon } }
  /**
   * Taxa indexed by taxon UUID.
   */
  taxonIndex: { [taxonUuid: string]: Taxon }
}
