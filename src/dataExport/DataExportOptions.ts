export type DataExportOptions = {
  addCycle?: boolean
  includeAnalysis?: boolean
  includeAncestorAttributes?: boolean
  includeCategoryItemsLabels?: boolean
  expandCategoryItems?: boolean
  exportSingleEntitiesIntoSeparateFiles?: boolean
  includeDateCreated?: boolean
  includeFileAttributeDefs?: boolean
  includeFiles?: boolean
  includeInternalUuids?: boolean
  includeReadOnlyAttributes?: boolean
  includeTaxonScientificName?: boolean
  keepFileNamesUnique?: boolean
  nullsToEmpty?: boolean
}

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
