import { CategoryItem } from '../../category'
import { Taxon } from '../../taxonomy'

export interface SurveyRefData {
  categoryItemUuidIndex: { [categoryUuid: string]: { [parentItemUuid: string]: { [code: string]: string } } }
  categoryItemIndex: { [categoryItemUuid: string]: CategoryItem }
  taxonUuidIndex: { [taxonomyUuid: string]: { [taxonCode: string]: Taxon } }
  taxonIndex: { [taxonUuid: string]: Taxon }
}
