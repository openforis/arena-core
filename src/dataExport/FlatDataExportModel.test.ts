import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { FlatDataExportModel, FlatDataExportColumnDataType } from './FlatDataExportModel'
import { FlatDataExportDefaultOptions, FlatDataExportOption } from './FlatDataExportOptions'
import { Surveys, Survey, defaultCycle } from '../survey'
import { createTestAdminUser } from '../tests/data'
import { FlatDataExportOptions } from './FlatDataExportOptions'

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

// Helper functions
const createTestSurvey = async (
  nodeDefBuilder: any,
  categoryBuilders: any[] = [],
  taxonomyBuilders: any[] = []
): Promise<Survey> => {
  const user = createTestAdminUser()
  let surveyBuilder = new SurveyBuilder(user, nodeDefBuilder)
  if (categoryBuilders.length > 0) surveyBuilder = surveyBuilder.categories(...categoryBuilders)
  if (taxonomyBuilders.length > 0) surveyBuilder = surveyBuilder.taxonomies(...taxonomyBuilders)
  return surveyBuilder.build()
}

const createTestModel = async (
  nodeDefBuilder: any,
  options?: FlatDataExportOptions,
  categoryBuilders: any[] = [],
  taxonomyBuilders: any[] = []
): Promise<FlatDataExportModel> => {
  const survey = await createTestSurvey(nodeDefBuilder, categoryBuilders, taxonomyBuilders)
  const nodeDefContext = Surveys.getNodeDefByName({ survey, name: 'cluster' })!
  return new FlatDataExportModel({ survey, cycle: defaultCycle, nodeDefContext, options })
}

describe('FlatDataExportModel', () => {
  describe('constructor and initialization', () => {
    test('creates model with default options', async () => {
      const model = await createTestModel(entityDef('cluster', integerDef('cluster_id').key(), textDef('cluster_name')))

      expect(model).toBeDefined()
      expect(model.survey).toBeDefined()
      expect(model.cycle).toBe(defaultCycle)
      expect(model.nodeDefContext).toBeDefined()
      expect(model.options).toEqual({
        ...FlatDataExportDefaultOptions,
      })
    })

    test('merges provided options with defaults', async () => {
      const customOptions = {
        [FlatDataExportOption.addCycle]: true,
        [FlatDataExportOption.expandCategoryItems]: true,
      }

      const model = await createTestModel(entityDef('cluster', integerDef('cluster_id').key()), customOptions)

      expect(model.options[FlatDataExportOption.addCycle]).toBe(true)
      expect(model.options[FlatDataExportOption.expandCategoryItems]).toBe(true)
      expect(model.options[FlatDataExportOption.includeCategoryItemsLabels]).toBe(true) // from defaults
      expect(model.options[FlatDataExportOption.includeAnalysis]).toBe(true) // from defaults
    })

    test('initializes columns on construction', async () => {
      const model = await createTestModel(entityDef('cluster', integerDef('cluster_id').key(), textDef('cluster_name')))

      expect(model.columns).toBeDefined()
      expect(Array.isArray(model.columns)).toBe(true)
      expect(model.columns.length).toBeGreaterThan(0)
    })
  })

  describe('column headers', () => {
    test('includes cycle header when addCycle option is true', async () => {
      const model = await createTestModel(entityDef('cluster', integerDef('cluster_id').key()), { addCycle: true })

      expect(model.headers).toContain('record_cycle')
    })

    test('excludes cycle header when addCycle option is false', async () => {
      const model = await createTestModel(entityDef('cluster', integerDef('cluster_id').key()), { addCycle: false })

      expect(model.headers).not.toContain('record_cycle')
    })

    test('returns all headers', async () => {
      const model = await createTestModel(
        entityDef('cluster', integerDef('cluster_id').key(), textDef('cluster_name'), decimalDef('cluster_area')),
        { addCycle: false }
      )

      const headers = model.headers
      expect(headers).toContain('cluster_id')
      expect(headers).toContain('cluster_name')
      expect(headers).toContain('cluster_area')
    })
  })

  describe('column data types', () => {
    test('creates numeric columns for integer type', async () => {
      const model = await createTestModel(entityDef('cluster', integerDef('cluster_id').key()))
      const idColumn = model.getColumnByHeader('cluster_id')
      expect(idColumn).toBeDefined()
      expect(idColumn?.dataType).toBe(FlatDataExportColumnDataType.numeric)
    })

    test('creates numeric columns for decimal type', async () => {
      const model = await createTestModel(
        entityDef('cluster', integerDef('cluster_id').key(), decimalDef('cluster_area'))
      )
      const areaColumn = model.getColumnByHeader('cluster_area')
      expect(areaColumn).toBeDefined()
      expect(areaColumn?.dataType).toBe(FlatDataExportColumnDataType.numeric)
    })

    test('creates text columns for text type', async () => {
      const model = await createTestModel(entityDef('cluster', integerDef('cluster_id').key(), textDef('cluster_name')))
      const nameColumn = model.getColumnByHeader('cluster_name')
      expect(nameColumn).toBeDefined()
      expect(nameColumn?.dataType).toBe(FlatDataExportColumnDataType.text)
    })

    test('creates text columns for date type', async () => {
      const model = await createTestModel(entityDef('cluster', integerDef('cluster_id').key(), dateDef('visit_date')))
      const dateColumn = model.getColumnByHeader('visit_date')
      expect(dateColumn).toBeDefined()
      expect(dateColumn?.dataType).toBe(FlatDataExportColumnDataType.text)
    })

    test('creates boolean column for boolean type', async () => {
      const model = await createTestModel(
        entityDef('cluster', integerDef('cluster_id').key(), booleanDef('is_accessible'))
      )
      const boolColumn = model.getColumnByHeader('is_accessible')
      expect(boolColumn).toBeDefined()
      expect(boolColumn?.dataType).toBe(FlatDataExportColumnDataType.boolean)
    })
  })

  describe('coordinate columns', () => {
    test('creates separate columns for x, y, and srs', async () => {
      const model = await createTestModel(
        entityDef('cluster', integerDef('cluster_id').key(), coordinateDef('cluster_location'))
      )

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
      const model = await createTestModel(
        entityDef('cluster', integerDef('cluster_id').key(), fileDef('cluster_photo')),
        { includeFileAttributeDefs: true, includeFiles: true }
      )

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
      const model = await createTestModel(
        entityDef('cluster', integerDef('cluster_id').key(), codeDef('region', 'region_category')),
        { includeCategoryItemsLabels: true },
        [category('region_category').levels('region').items(categoryItem('N'), categoryItem('S'))]
      )

      const labelColumn = model.getColumnByHeader('region_label')
      expect(labelColumn).toBeDefined()
    })

    test('excludes category item labels when option is false', async () => {
      const model = await createTestModel(
        entityDef('cluster', integerDef('cluster_id').key(), codeDef('region', 'region_category')),
        { includeCategoryItemsLabels: false },
        [category('region_category').levels('region').items(categoryItem('N'), categoryItem('S'))]
      )

      const labelColumn = model.getColumnByHeader('region_label')
      expect(labelColumn).toBeUndefined()
    })

    test('expands category items into columns when option is true', async () => {
      const model = await createTestModel(
        entityDef('cluster', integerDef('cluster_id').key(), codeDef('region', 'region_category')),
        { expandCategoryItems: true },
        [category('region_category').levels('region').items(categoryItem('N'), categoryItem('S'))]
      )

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
      const model = await createTestModel(
        entityDef('cluster', integerDef('cluster_id').key(), taxonDef('species_code', 'species_taxonomy')),
        { includeTaxonScientificName: true },
        [],
        [
          taxonomy('species_taxonomy').taxa(
            taxon('s001', 'Genus', 'genus', 'Genus species'),
            taxon('s002', 'AnotherGenus', 'anothergenus', 'AnotherGenus species')
          ),
        ]
      )

      const scientificNameColumn = model.getColumnByHeader('species_code_scientific_name')
      const vernacularNameColumn = model.getColumnByHeader('species_code_vernacular_name')

      expect(scientificNameColumn).toBeDefined()
      expect(scientificNameColumn?.dataType).toBe(FlatDataExportColumnDataType.text)
      expect(vernacularNameColumn).toBeDefined()
      expect(vernacularNameColumn?.dataType).toBe(FlatDataExportColumnDataType.text)
    })

    test('excludes taxon scientific name when option is false', async () => {
      const model = await createTestModel(
        entityDef('cluster', integerDef('cluster_id').key(), taxonDef('species_code', 'species_taxonomy')),
        { includeTaxonScientificName: false },
        [],
        [taxonomy('species_taxonomy').taxa(taxon('s001', 'Genus', 'genus', 'Genus species'))]
      )

      const scientificNameColumn = model.getColumnByHeader('species_code_scientific_name')
      const vernacularNameColumn = model.getColumnByHeader('species_code_vernacular_name')

      expect(scientificNameColumn).toBeUndefined()
      expect(vernacularNameColumn).toBeUndefined()
    })
  })

  describe('getColumnByHeader', () => {
    test('returns column when header exists', async () => {
      const model = await createTestModel(entityDef('cluster', integerDef('cluster_id').key(), textDef('cluster_name')))

      const column = model.getColumnByHeader('cluster_id')
      expect(column).toBeDefined()
      expect(column?.header).toBe('cluster_id')
    })

    test('returns undefined when header does not exist', async () => {
      const model = await createTestModel(entityDef('cluster', integerDef('cluster_id').key()))

      const column = model.getColumnByHeader('nonexistent_header')
      expect(column).toBeUndefined()
    })
  })

  describe('key attributes', () => {
    test('marks key columns with key property', async () => {
      const model = await createTestModel(entityDef('cluster', integerDef('cluster_id').key(), textDef('cluster_name')))

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
