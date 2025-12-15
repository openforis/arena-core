export type DataExportOptions = {
  addCycle?: boolean
  includeAnalysis?: boolean
  includeAncestorAttributes?: boolean
  includeCategoryItemsLabels?: boolean
  expandCategoryItems?: boolean
  exportSingleEntitiesIntoSeparateFiles?: boolean
  includeInternalUuids?: boolean
  includeDateCreated?: boolean
  includeFiles?: boolean
  includeReadOnlyAttributes?: boolean
  includeTaxonScientificName?: boolean
  nullsToEmpty?: boolean
  keepFileNamesUnique?: boolean
}
