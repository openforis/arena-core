import { Validation, Validations } from '../validation'

const prefixValidationFieldChildrenCount = 'childrenCount_'

const isValidationChildrenCountKey = (validationFieldKey: string) =>
  validationFieldKey?.startsWith(prefixValidationFieldChildrenCount)

const getValidationChildrenCountKey = (params: { nodeParentUuid: string; nodeDefChildUuid: string }): string => {
  const { nodeParentUuid, nodeDefChildUuid } = params
  return `${prefixValidationFieldChildrenCount}${nodeParentUuid}_${nodeDefChildUuid}`
}

const extractValidationChildrenCountKeyParentUuid = (validationFieldKey: string) => validationFieldKey?.split('_')[1]

const extractValidationChildrenCountKeyNodeDefUuid = (validationFieldKey: string) => validationFieldKey?.split('_')[2]

const getValidationChildrenCount =
  (params: { nodeParentUuid: string; nodeDefChildUuid: string }) =>
  (validation: Validation): Validation => {
    const key = getValidationChildrenCountKey(params)
    return Validations.getFieldValidation(key)(validation)
  }

const getValidationNode =
  (params: { nodeUuid: string }) =>
  (validation: Validation): Validation => {
    const { nodeUuid } = params
    return Validations.getFieldValidation(nodeUuid)(validation)
  }

export const RecordValidations = {
  prefixValidationFieldChildrenCount,

  isValidationChildrenCountKey,
  extractValidationChildrenCountKeyParentUuid,
  extractValidationChildrenCountKeyNodeDefUuid,
  getValidationChildrenCountKey,
  getValidationChildrenCount,
  getValidationNode,
}
