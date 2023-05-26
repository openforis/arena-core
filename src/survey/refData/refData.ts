import { CategoryItem } from '../../category'
import { SRSIndex } from '../../srs'
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
   * Taxa UUIDs indexed by taxonomy UUID and taxon code.
   */
  taxonUuidIndex: { [taxonomyUuid: string]: { [taxonCode: string]: string } }
  /**
   * Taxa indexed by taxon UUID.
   */
  taxonIndex: { [taxonUuid: string]: Taxon }
  /**
   * SRSs index by SRS code.
   */
  srsIndex: SRSIndex
}
