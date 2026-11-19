import { ArenaCategoryItem } from '../../category'
import { ArenaTaxon } from '../../taxonomy'

/**
 * Cache of reference data items (category items and taxa).
 */
export interface ArenaSurveyRefData {
  /**
   * Category item UUIDs indexed by category UUID, parent item UUID and code.
   */
  categoryItemUuidIndex: { [categoryUuid: string]: { [parentItemUuid: string]: { [code: string]: string } } }
  /**
   * Category items indexed by item UUID.
   */
  categoryItemIndex: { [categoryItemUuid: string]: ArenaCategoryItem }
  /**
   * Taxa UUIDs indexed by taxonomy UUID and taxon code.
   */
  taxonUuidIndex: { [taxonomyUuid: string]: { [taxonCode: string]: string } }
  /**
   * Taxa indexed by taxon UUID.
   */
  taxonIndex: { [taxonUuid: string]: ArenaTaxon }
}
