export enum DataExportOption {
  addCycle = 'addCycle',
  includeAnalysis = 'includeAnalysis',
  includeAncestorAttributes = 'includeAncestorAttributes',
  includeCategoryItemsLabels = 'includeCategoryItemsLabels',
  expandCategoryItems = 'expandCategoryItems',
  exportSingleEntitiesIntoSeparateFiles = 'exportSingleEntitiesIntoSeparateFiles',
  includeDateCreated = 'includeDateCreated',
  includeFileAttributeDefs = 'includeFileAttributeDefs',
  includeFiles = 'includeFiles',
  includeInternalUuids = 'includeInternalUuids',
  includeReadOnlyAttributes = 'includeReadOnlyAttributes',
  includeTaxonScientificName = 'includeTaxonScientificName',
  keepFileNamesUnique = 'keepFileNamesUnique',
  nullsToEmpty = 'nullsToEmpty',
}

export type DataExportOptions = Partial<Record<DataExportOption, boolean>>

export const DataExportDefaultOptions: DataExportOptions = {
  expandCategoryItems: false,
  exportSingleEntitiesIntoSeparateFiles: false,
  includeAnalysis: true,
  includeAncestorAttributes: false,
  includeCategoryItemsLabels: true,
  includeFiles: true,
  includeReadOnlyAttributes: true,
  includeTaxonScientificName: true,
}
