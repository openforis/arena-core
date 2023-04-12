import { Validation, Validations } from '../validation'

const prefixValidationFieldChildrenCount = 'childrenCount_'

const getValidationChildrenCountKey = (params: { nodeParentUuid: string; nodeDefChildUuid: string }): string => {
  const { nodeParentUuid, nodeDefChildUuid } = params
  return `${prefixValidationFieldChildrenCount}${nodeParentUuid}_${nodeDefChildUuid}`
}

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

  getValidationChildrenCountKey,
  getValidationChildrenCount,
  getValidationNode,
}
