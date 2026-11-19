export enum FlatDataExportOption {
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
  includeMultipleAttributes = 'includeMultipleAttributes',
  includeReadOnlyAttributes = 'includeReadOnlyAttributes',
  includeTaxonScientificName = 'includeTaxonScientificName',
  keepFileNamesUnique = 'keepFileNamesUnique',
  nullsToEmpty = 'nullsToEmpty',
}

export type ArenaFlatDataExportOptions = Partial<Record<FlatDataExportOption, boolean>>

export const FlatDataExportDefaultOptions: ArenaFlatDataExportOptions = {
  expandCategoryItems: false,
  exportSingleEntitiesIntoSeparateFiles: false,
  includeAnalysis: true,
  includeAncestorAttributes: false,
  includeCategoryItemsLabels: true,
  includeFiles: true,
  includeMultipleAttributes: false,
  includeReadOnlyAttributes: true,
  includeTaxonScientificName: true,
}
