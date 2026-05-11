import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { FlatDataExportModel, FlatDataExportColumnDataType } from './FlatDataExportModel'
import { FlatDataExportDefaultOptions, FlatDataExportOption } from './FlatDataExportOptions'
import { Surveys, defaultCycle } from '../survey'
import { createTestAdminUser } from '../tests/data'

const {
  booleanDef,
  category,
  categoryItem,
  codeDef,
  coordinateDef,
  dateDef,
  decimalDef,
  entityDef,
  fileDef,
  integerDef,
  taxon,
  taxonDef,
  taxonomy,
  textDef,
} = SurveyObjectBuilders

describe('FlatDataExportModel', () => {
  describe('constructor and initialization', () => {
    test('creates model with default options', async () => {
      const user = createTestAdminUser()
      const survey = await new SurveyBuilder(
        user,
        entityDef('cluster', integerDef('cluster_id').key(), textDef('cluster_name'))
      ).build()

      const nodeDefContext = Surveys.getNodeDefByName({ survey, name: 'cluster' })!
      const model = new FlatDataExportModel({
        survey,
        cycle: defaultCycle,
        nodeDefContext,
      })

      expect(model).toBeDefined()
      expect(model.survey).toBe(survey)
      expect(model.cycle).toBe(defaultCycle)
      expect(model.nodeDefContext).toBe(nodeDefContext)
      expect(model.options).toEqual({
        ...FlatDataExportDefaultOptions,
      })
    })

    test('merges provided options with defaults', async () => {
      const user = createTestAdminUser()
      const survey = await new SurveyBuilder(user, entityDef('cluster', integerDef('cluster_id').key())).build()

      const nodeDefContext = Surveys.getNodeDefByName({ survey, name: 'cluster' })!
      const customOptions = {
        [FlatDataExportOption.addCycle]: true,
        [FlatDataExportOption.expandCategoryItems]: true,
      }

      const model = new FlatDataExportModel({
        survey,
        cycle: defaultCycle,
        nodeDefContext,
        options: customOptions,
      })

      expect(model.options[FlatDataExportOption.addCycle]).toBe(true)
      expect(model.options[FlatDataExportOption.expandCategoryItems]).toBe(true)
      expect(model.options[FlatDataExportOption.includeCategoryItemsLabels]).toBe(true) // from defaults
      expect(model.options[FlatDataExportOption.includeAnalysis]).toBe(true) // from defaults
    })

    test('initializes columns on construction', async () => {
      const user = createTestAdminUser()
      const survey = await new SurveyBuilder(
        user,
        entityDef('cluster', integerDef('cluster_id').key(), textDef('cluster_name'))
      ).build()

      const nodeDefContext = Surveys.getNodeDefByName({ survey, name: 'cluster' })!
      const model = new FlatDataExportModel({
        survey,
        cycle: defaultCycle,
        nodeDefContext,
      })

      expect(model.columns).toBeDefined()
      expect(Array.isArray(model.columns)).toBe(true)
      expect(model.columns.length).toBeGreaterThan(0)
    })
  })

  describe('column headers', () => {
    test('includes cycle header when addCycle option is true', async () => {
      const user = createTestAdminUser()
      const survey = await new SurveyBuilder(user, entityDef('cluster', integerDef('cluster_id').key())).build()

      const nodeDefContext = Surveys.getNodeDefByName({ survey, name: 'cluster' })!
      const model = new FlatDataExportModel({
        survey,
        cycle: defaultCycle,
        nodeDefContext,
        options: { addCycle: true },
      })

      const headers = model.headers
      expect(headers).toContain('record_cycle')
    })

    test('excludes cycle header when addCycle option is false', async () => {
      const user = createTestAdminUser()
      const survey = await new SurveyBuilder(user, entityDef('cluster', integerDef('cluster_id').key())).build()

      const nodeDefContext = Surveys.getNodeDefByName({ survey, name: 'cluster' })!
      const model = new FlatDataExportModel({
        survey,
        cycle: defaultCycle,
        nodeDefContext,
        options: { addCycle: false },
      })

      const headers = model.headers
      expect(headers).not.toContain('record_cycle')
    })

    test('returns all headers', async () => {
      const user = createTestAdminUser()
      const survey = await new SurveyBuilder(
        user,
        entityDef('cluster', integerDef('cluster_id').key(), textDef('cluster_name'), decimalDef('cluster_area'))
      ).build()

      const nodeDefContext = Surveys.getNodeDefByName({ survey, name: 'cluster' })!
      const model = new FlatDataExportModel({
        survey,
        cycle: defaultCycle,
        nodeDefContext,
        options: { addCycle: false },
      })

      const headers = model.headers
      expect(headers).toContain('cluster_id')
      expect(headers).toContain('cluster_name')
      expect(headers).toContain('cluster_area')
    })
  })

  describe('column data types', () => {
    test('creates numeric columns for integer type', async () => {
      const user = createTestAdminUser()
      const survey = await new SurveyBuilder(user, entityDef('cluster', integerDef('cluster_id').key())).build()

      const nodeDefContext = Surveys.getNodeDefByName({ survey, name: 'cluster' })!
      const model = new FlatDataExportModel({
        survey,
        cycle: defaultCycle,
        nodeDefContext,
      })

      const idColumn = model.getColumnByHeader('cluster_id')
      expect(idColumn).toBeDefined()
      expect(idColumn?.dataType).toBe(FlatDataExportColumnDataType.numeric)
    })

    test('creates numeric columns for decimal type', async () => {
      const user = createTestAdminUser()
      const survey = await new SurveyBuilder(
        user,
        entityDef('cluster', integerDef('cluster_id').key(), decimalDef('cluster_area'))
      ).build()

      const nodeDefContext = Surveys.getNodeDefByName({ survey, name: 'cluster' })!
      const model = new FlatDataExportModel({
        survey,
        cycle: defaultCycle,
        nodeDefContext,
      })

      const areaColumn = model.getColumnByHeader('cluster_area')
      expect(areaColumn).toBeDefined()
      expect(areaColumn?.dataType).toBe(FlatDataExportColumnDataType.numeric)
    })

    test('creates text columns for text type', async () => {
      const user = createTestAdminUser()
      const survey = await new SurveyBuilder(
        user,
        entityDef('cluster', integerDef('cluster_id').key(), textDef('cluster_name'))
      ).build()

      const nodeDefContext = Surveys.getNodeDefByName({ survey, name: 'cluster' })!
      const model = new FlatDataExportModel({
        survey,
        cycle: defaultCycle,
        nodeDefContext,
      })

      const nameColumn = model.getColumnByHeader('cluster_name')
      expect(nameColumn).toBeDefined()
      expect(nameColumn?.dataType).toBe(FlatDataExportColumnDataType.text)
    })

    test('creates text columns for date type', async () => {
      const user = createTestAdminUser()
      const survey = await new SurveyBuilder(
        user,
        entityDef('cluster', integerDef('cluster_id').key(), dateDef('visit_date'))
      ).build()

      const nodeDefContext = Surveys.getNodeDefByName({ survey, name: 'cluster' })!
      const model = new FlatDataExportModel({
        survey,
        cycle: defaultCycle,
        nodeDefContext,
      })

      const dateColumn = model.getColumnByHeader('visit_date')
      expect(dateColumn).toBeDefined()
      expect(dateColumn?.dataType).toBe(FlatDataExportColumnDataType.text)
    })

    test('creates boolean column for boolean type', async () => {
      const user = createTestAdminUser()
      const survey = await new SurveyBuilder(
        user,
        entityDef('cluster', integerDef('cluster_id').key(), booleanDef('is_accessible'))
      ).build()

      const nodeDefContext = Surveys.getNodeDefByName({ survey, name: 'cluster' })!
      const model = new FlatDataExportModel({
        survey,
        cycle: defaultCycle,
        nodeDefContext,
      })

      const boolColumn = model.getColumnByHeader('is_accessible')
      expect(boolColumn).toBeDefined()
      expect(boolColumn?.dataType).toBe(FlatDataExportColumnDataType.boolean)
    })
  })

  describe('coordinate columns', () => {
    test('creates separate columns for x, y, and srs', async () => {
      const user = createTestAdminUser()
      const survey = await new SurveyBuilder(
        user,
        entityDef('cluster', integerDef('cluster_id').key(), coordinateDef('cluster_location'))
      ).build()

      const nodeDefContext = Surveys.getNodeDefByName({ survey, name: 'cluster' })!
      const model = new FlatDataExportModel({
        survey,
        cycle: defaultCycle,
        nodeDefContext,
      })

      const xColumn = model.getColumnByHeader('cluster_location_x')
      const yColumn = model.getColumnByHeader('cluster_location_y')
      const srsColumn = model.getColumnByHeader('cluster_location_srs')

      expect(xColumn).toBeDefined()
      expect(xColumn?.dataType).toBe(FlatDataExportColumnDataType.numeric)
      expect(yColumn).toBeDefined()
      expect(yColumn?.dataType).toBe(FlatDataExportColumnDataType.numeric)
      expect(srsColumn).toBeDefined()
      expect(srsColumn?.dataType).toBe(FlatDataExportColumnDataType.text)
    })
  })

  describe('file columns', () => {
    test('creates columns for file uuid and name', async () => {
      const user = createTestAdminUser()
      const survey = await new SurveyBuilder(
        user,
        entityDef('cluster', integerDef('cluster_id').key(), fileDef('cluster_photo'))
      ).build()

      const nodeDefContext = Surveys.getNodeDefByName({ survey, name: 'cluster' })!
      const model = new FlatDataExportModel({
        survey,
        cycle: defaultCycle,
        nodeDefContext,
        options: { includeFileAttributeDefs: true, includeFiles: true },
      })

      const uuidColumn = model.getColumnByHeader('cluster_photo_file_uuid')
      const nameColumn = model.getColumnByHeader('cluster_photo_file_name')

      expect(uuidColumn).toBeDefined()
      expect(uuidColumn?.dataType).toBe(FlatDataExportColumnDataType.text)
      expect(nameColumn).toBeDefined()
      expect(nameColumn?.dataType).toBe(FlatDataExportColumnDataType.text)
    })
  })

  describe('category columns', () => {
    test('includes category item labels when option is true', async () => {
      const user = createTestAdminUser()
      const survey = await new SurveyBuilder(
        user,
        entityDef('cluster', integerDef('cluster_id').key(), codeDef('region', 'region_category'))
      )
        .categories(category('region_category').levels('region').items(categoryItem('N'), categoryItem('S')))
        .build()

      const nodeDefContext = Surveys.getNodeDefByName({ survey, name: 'cluster' })!
      const model = new FlatDataExportModel({
        survey,
        cycle: defaultCycle,
        nodeDefContext,
        options: { includeCategoryItemsLabels: true },
      })

      const labelColumn = model.getColumnByHeader('region_label')
      expect(labelColumn).toBeDefined()
    })

    test('excludes category item labels when option is false', async () => {
      const user = createTestAdminUser()
      const survey = await new SurveyBuilder(
        user,
        entityDef('cluster', integerDef('cluster_id').key(), codeDef('region', 'region_category'))
      )
        .categories(category('region_category').levels('region').items(categoryItem('N'), categoryItem('S')))
        .build()

      const nodeDefContext = Surveys.getNodeDefByName({ survey, name: 'cluster' })!
      const model = new FlatDataExportModel({
        survey,
        cycle: defaultCycle,
        nodeDefContext,
        options: { includeCategoryItemsLabels: false },
      })

      const labelColumn = model.getColumnByHeader('region_label')
      expect(labelColumn).toBeUndefined()
    })

    test('expands category items into columns when option is true', async () => {
      const user = createTestAdminUser()
      const survey = await new SurveyBuilder(
        user,
        entityDef('cluster', integerDef('cluster_id').key(), codeDef('region', 'region_category'))
      )
        .categories(category('region_category').levels('region').items(categoryItem('N'), categoryItem('S')))
        .build()

      const nodeDefContext = Surveys.getNodeDefByName({ survey, name: 'cluster' })!
      const model = new FlatDataExportModel({
        survey,
        cycle: defaultCycle,
        nodeDefContext,
        options: { expandCategoryItems: true },
      })

      const nColumn = model.getColumnByHeader('region__N')
      const sColumn = model.getColumnByHeader('region__S')

      expect(nColumn).toBeDefined()
      expect(nColumn?.dataType).toBe(FlatDataExportColumnDataType.boolean)
      expect(sColumn).toBeDefined()
      expect(sColumn?.dataType).toBe(FlatDataExportColumnDataType.boolean)
    })
  })

  describe('taxon columns', () => {
    test('includes taxon scientific name when option is true', async () => {
      const user = createTestAdminUser()
      const survey = await new SurveyBuilder(
        user,
        entityDef('cluster', integerDef('cluster_id').key(), taxonDef('species_code', 'species_taxonomy'))
      )
        .taxonomies(
          taxonomy('species_taxonomy').taxa(
            taxon('s001', 'Genus', 'genus', 'Genus species'),
            taxon('s002', 'AnotherGenus', 'anothergenus', 'AnotherGenus species')
          )
        )
        .build()

      const nodeDefContext = Surveys.getNodeDefByName({ survey, name: 'cluster' })!
      const model = new FlatDataExportModel({
        survey,
        cycle: defaultCycle,
        nodeDefContext,
        options: { includeTaxonScientificName: true },
      })

      const scientificNameColumn = model.getColumnByHeader('species_code_scientific_name')
      const vernacularNameColumn = model.getColumnByHeader('species_code_vernacular_name')

      expect(scientificNameColumn).toBeDefined()
      expect(scientificNameColumn?.dataType).toBe(FlatDataExportColumnDataType.text)
      expect(vernacularNameColumn).toBeDefined()
      expect(vernacularNameColumn?.dataType).toBe(FlatDataExportColumnDataType.text)
    })

    test('excludes taxon scientific name when option is false', async () => {
      const user = createTestAdminUser()
      const survey = await new SurveyBuilder(
        user,
        entityDef('cluster', integerDef('cluster_id').key(), taxonDef('species_code', 'species_taxonomy'))
      )
        .taxonomies(taxonomy('species_taxonomy').taxa(taxon('s001', 'Genus', 'genus', 'Genus species')))
        .build()

      const nodeDefContext = Surveys.getNodeDefByName({ survey, name: 'cluster' })!
      const model = new FlatDataExportModel({
        survey,
        cycle: defaultCycle,
        nodeDefContext,
        options: { includeTaxonScientificName: false },
      })

      const scientificNameColumn = model.getColumnByHeader('species_code_scientific_name')
      const vernacularNameColumn = model.getColumnByHeader('species_code_vernacular_name')

      expect(scientificNameColumn).toBeUndefined()
      expect(vernacularNameColumn).toBeUndefined()
    })
  })

  describe('getColumnByHeader', () => {
    test('returns column when header exists', async () => {
      const user = createTestAdminUser()
      const survey = await new SurveyBuilder(
        user,
        entityDef('cluster', integerDef('cluster_id').key(), textDef('cluster_name'))
      ).build()

      const nodeDefContext = Surveys.getNodeDefByName({ survey, name: 'cluster' })!
      const model = new FlatDataExportModel({
        survey,
        cycle: defaultCycle,
        nodeDefContext,
      })

      const column = model.getColumnByHeader('cluster_id')
      expect(column).toBeDefined()
      expect(column?.header).toBe('cluster_id')
    })

    test('returns undefined when header does not exist', async () => {
      const user = createTestAdminUser()
      const survey = await new SurveyBuilder(user, entityDef('cluster', integerDef('cluster_id').key())).build()

      const nodeDefContext = Surveys.getNodeDefByName({ survey, name: 'cluster' })!
      const model = new FlatDataExportModel({
        survey,
        cycle: defaultCycle,
        nodeDefContext,
      })

      const column = model.getColumnByHeader('nonexistent_header')
      expect(column).toBeUndefined()
    })
  })

  describe('key attributes', () => {
    test('marks key columns with key property', async () => {
      const user = createTestAdminUser()
      const survey = await new SurveyBuilder(
        user,
        entityDef('cluster', integerDef('cluster_id').key(), textDef('cluster_name'))
      ).build()

      const nodeDefContext = Surveys.getNodeDefByName({ survey, name: 'cluster' })!
      const model = new FlatDataExportModel({
        survey,
        cycle: defaultCycle,
        nodeDefContext,
      })

      const keyColumn = model.getColumnByHeader('cluster_id')
      const nonKeyColumn = model.getColumnByHeader('cluster_name')

      expect(keyColumn?.key).toBe(true)
      expect(nonKeyColumn?.key).toBeUndefined()
    })
  })

  describe('static properties and methods', () => {
    test('exports columnDataType enum', () => {
      expect(FlatDataExportModel.columnDataType).toBeDefined()
      expect(FlatDataExportModel.columnDataType.boolean).toBe('boolean')
      expect(FlatDataExportModel.columnDataType.numeric).toBe('numeric')
      expect(FlatDataExportModel.columnDataType.text).toBe('text')
    })

    test('exports getExpandedCategoryItemColumnHeader', () => {
      expect(FlatDataExportModel.getExpandedCategoryItemColumnHeader).toBeDefined()
      const header = FlatDataExportModel.getExpandedCategoryItemColumnHeader({
        nodeDef: { props: { name: 'test_field' } },
        code: 'A',
      })
      expect(header).toBe('test_field__A')
    })
  })
})
