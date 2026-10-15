/**
 * Keys of the errors thrown by arena-core as SystemError (translatable, see SystemError.key).
 */
export const SystemErrorKeys = {
  expression: {
    booleanOperatorNotSupported: 'expression.booleanOperatorNotSupported',
    functionHasTooFewArguments: 'expression.functionHasTooFewArguments',
    functionHasTooManyArguments: 'expression.functionHasTooManyArguments',
    identifierNotFound: 'expression.identifierNotFound',
    invalidAttributeValuePropertyName: 'expression.invalidAttributeValuePropertyName',
    invalidCalleeType: 'expression.invalidCalleeType',
    invalidCategoryExtraProp: 'expression.invalidCategoryExtraProp',
    invalidCategoryName: 'expression.invalidCategoryName',
    invalidTaxonVernacularNameLanguageCode: 'expression.invalidTaxonVernacularNameLanguageCode',
    invalidTaxonomyExtraProp: 'expression.invalidTaxonomyExtraProp',
    invalidTaxonomyName: 'expression.invalidTaxonomyName',
    missingFunctionParameters: 'expression.missingFunctionParameters',
    multipleNodesFoundForNodeDef: 'expression.multipleNodesFoundForNodeDef',
    nodeNotFoundForNodeDef: 'expression.nodeNotFoundForNodeDef',
    notSupported: 'expression.notSupported',
    unaryOperatorNotSupported: 'expression.unaryOperatorNotSupported',
    undefinedFunction: 'expression.undefinedFunction',
    unsupportedFunctionType: 'expression.unsupportedFunctionType',
  },
  geo: {
    pointNotFilled: 'geo.pointNotFilled',
    srsNotFound: 'geo.srsNotFound',
    transformFailed: 'geo.transformFailed',
  },
  job: {
    canceledOrErrorsFound: 'jobCanceledOrErrorsFound',
  },
  nodeDef: {
    hierarchyCircularDependency: 'nodeDef.hierarchyCircularDependency',
    parentNotFound: 'nodeDef.parentNotFound',
  },
  record: {
    dependencyOnRootFound: 'record.nodes.dependents.dependencyOnRootFound',
    enumeratorNodeNotFound: 'record.enumeratorNodeNotFound',
    multipleNodesFound: 'systemError.record.multipleNodesFound',
    nodeNotFound: 'record.nodeNotFound',
    nodesIndexNotInitialized: 'record.nodesIndexNotInitialized',
    updateSelfAndDependentsDefaultValues: 'record.updateSelfAndDependentsDefaultValues',
    updateSelfAndDependentsFileNames: 'record.updateSelfAndDependentsFileNames',
  },
  survey: {
    emptyNodeDefs: 'survey.emptyNodeDefs',
    nodeDefNameNotFound: 'survey.nodeDefNameNotFound',
    nodeDefUuidNotFound: 'survey.nodeDefUuidNotFound',
    rootDefNotFound: 'survey.rootDefNotFound',
  },
} as const
