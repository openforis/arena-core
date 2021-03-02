import { User } from '../auth'
import { Taxonomy } from './taxonomy'
import { Taxon } from 'src/taxonomy/taxon'

export interface Job {}

export interface TaxonomyService {
  // ==== CREATE
  create(options: { user: User; surveyId: string; taxonomy: Taxonomy }): Promise<Taxonomy>

  // ==== READ
  count(options: { surveyId: string }): Promise<number>

  countTaxa(options: { surveyId: string; taxonomyUuid: string; draft: boolean }): Promise<number>

  getMany(options: {
    draft: boolean
    limit: number
    offset: number
    search: string
    surveyId: string
    validate: boolean
  }): Promise<Array<Taxonomy>>

  get(options: { surveyId: string; taxonomyUuid: string; draft: boolean; validate: boolean }): Promise<Taxonomy>

  getTaxaByByVernacularName(options: {
    surveyId: string
    taxonomyUuid: string
    filterValue: string
    draft: boolean
    includeUnlUnk: boolean
  }): Promise<Array<Taxon>>

  getTaxaByCode(options: {
    surveyId: string
    taxonomyUuid: string
    filterValue: string
    draft: boolean
    includeUnlUnk: boolean
  }): Promise<Array<Taxon>>

  getTaxaByScientificName(options: {
    surveyId: string
    taxonomyUuid: string
    filterValue: string
    draft: boolean
    includeUnlUnk: boolean
  }): Promise<Array<Taxon>>

  getTaxaWithVernacularNames(options: {
    surveyId: string
    taxonomyUuid: string
    draft: boolean
    limit: number
    offset: number
  }): Promise<Array<Taxon>>

  getTaxonVernacularNameByUuid(options: {
    surveyId: string
    vernacularNameUuid: string
    draft: boolean
  }): Promise<Taxon>

  getTaxonByUuid(options: { surveyId: string; taxonUuid: string; draft: boolean }): Promise<Taxon>

  // ==== UPDATE

  updateTaxonomyProp(options: {
    user: User
    surveyId: string
    taxonomyUuid: string
    key: string
    value: any
  }): Promise<void>
  importTaxonomy(options: { user: User; surveyId: string; taxonomyUuid: string; tempFilePath: string }): Promise<Job>

  // ==== DELETE
  delete(options: { user: User; surveyId: string; taxonomyUuid: string }): void
}
