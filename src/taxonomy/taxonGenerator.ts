import { ExtraPropsDataGenerator } from '../extraProp'
import { ArenaSurvey } from '../survey'
import { getTaxonomyByUuid } from '../survey/surveys/surveysGetters'
import { UUIDs } from '../utils'
import { ArenaTaxon } from './taxon'
import { Taxonomies } from './taxonomies'

const generateTaxon = (params: { survey: ArenaSurvey; taxonomyUuid: string }): ArenaTaxon | null => {
  const { survey, taxonomyUuid } = params
  const taxonomy = taxonomyUuid ? getTaxonomyByUuid({ survey, taxonomyUuid }) : null
  if (!taxonomy) return null
  const extraPropDefs = Taxonomies.getExtraPropDefs(taxonomy)

  const taxon: ArenaTaxon = {
    uuid: UUIDs.v4(),
    props: { code: 'AFZ/QUA', family: 'Fabaceae', genus: 'Afzelia', scientificName: 'Afzelia quanzensis' },
  }
  if (extraPropDefs) {
    taxon.props.extra = ExtraPropsDataGenerator.generateData({ extraPropDefs })
  }
  return taxon
}

export const TaxonGenerator = {
  generateTaxon,
}
