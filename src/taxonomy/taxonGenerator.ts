import { ExtraPropsDataGenerator } from '../extraProp'
import { Survey, Surveys } from '../survey'
import { Taxon } from './taxon'
import { Taxonomies } from './taxonomies'
import { UUIDs } from '../utils'

const generateTaxon = (params: { survey: Survey; taxonomyUuid: string }): Taxon | null => {
  const { survey, taxonomyUuid } = params
  const taxonomy = taxonomyUuid ? Surveys.getTaxonomyByUuid({ survey, taxonomyUuid }) : null
  if (!taxonomy) return null
  const extraPropDefs = Taxonomies.getExtraPropDefs(taxonomy)

  const taxon: Taxon = {
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
