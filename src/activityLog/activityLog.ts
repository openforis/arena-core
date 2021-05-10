export enum ActivityLogType {
  // Survey
  surveyCreate = 'surveyCreate',
  surveyPropUpdate = 'surveyPropUpdate',
  surveyPublish = 'surveyPublish',
  surveyCollectImport = 'surveyCollectImport',
  surveyArenaImport = 'surveyArenaImport',

  // NodeDef
  nodeDefCreate = 'nodeDefCreate',
  nodeDefUpdate = 'nodeDefUpdate',
  nodeDefMarkDeleted = 'nodeDefMarkDeleted',

  // Category
  categoryInsert = 'categoryInsert',
  categoryPropUpdate = 'categoryPropUpdate',
  categoryDelete = 'categoryDelete',
  categoryLevelInsert = 'categoryLevelInsert',
  categoryLevelPropUpdate = 'categoryLevelPropUpdate',
  categoryLevelDelete = 'categoryLevelDelete',
  categoryLevelsDelete = 'categoryLevelsDelete', // System
  categoryItemInsert = 'categoryItemInsert',
  categoryItemPropUpdate = 'categoryItemPropUpdate',
  categoryItemDelete = 'categoryItemDelete',
  categoryImport = 'categoryImport',

  // Taxonomy
  taxonomyCreate = 'taxonomyCreate',
  taxonomyPropUpdate = 'taxonomyPropUpdate',
  taxonomyDelete = 'taxonomyDelete',
  taxonomyTaxaDelete = 'taxonomyTaxaDelete', // System
  taxonomyTaxaImport = 'taxonomyTaxaImport',
  taxonInsert = 'taxonInsert', // System
  taxonUpdate = 'taxonUpdate', // System

  // record
  recordCreate = 'recordCreate',
  recordDelete = 'recordDelete',
  recordStepUpdate = 'recordStepUpdate',

  // Node
  nodeCreate = 'nodeCreate',
  nodeValueUpdate = 'nodeValueUpdate',
  nodeDelete = 'nodeDelete',

  // User
  userInvite = 'userInvite',
  userUpdate = 'userUpdate',
  userRemove = 'userRemove',

  // Analysis
  chainCreate = 'chainCreate',
  chainPropUpdate = 'chainPropUpdate',
  chainNodeDef = 'chainNodeDef',
  processingChainStatusExecSuccess = 'processingChainStatusExecSuccess',
  processingChainDelete = 'processingChainDelete',
  processingStepCreate = 'processingStepCreate',
  processingStepPropUpdate = 'processingStepPropUpdate',
  processingStepDelete = 'processingStepDelete',
  processingStepCalculationCreate = 'processingStepCalculationCreate',
  processingStepCalculationIndexUpdate = 'processingStepCalculationIndexUpdate',
  processingStepCalculationUpdate = 'processingStepCalculationUpdate',
  processingStepCalculationDelete = 'processingStepCalculationDelete',
}

export interface ActivityLog<T extends ActivityLogType, C> {
  id: number
  content: C
  userUuid: string
  system: boolean
  dateCreated?: string
  type: T
}
