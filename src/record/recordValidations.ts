import { Validation, Validations } from '../validation'

const prefixValidationFieldChildrenCount = 'childrenCount_'

const isValidationChildrenCountKey = (validationFieldKey: string) =>
  validationFieldKey?.startsWith(prefixValidationFieldChildrenCount)

const getValidationChildrenCountKey = (params: { nodeParentInternalId: number; nodeDefChildUuid: string }): string => {
  const { nodeParentInternalId, nodeDefChildUuid } = params
  return `${prefixValidationFieldChildrenCount}${nodeParentInternalId}_${nodeDefChildUuid}`
}

const extractValidationChildrenCountKeyParentUuid = (validationFieldKey: string) => validationFieldKey?.split('_')[1]

const extractValidationChildrenCountKeyNodeDefUuid = (validationFieldKey: string) => validationFieldKey?.split('_')[2]

const getValidationChildrenCount =
  (params: { nodeParentInternalId: number; nodeDefChildUuid: string }) =>
  (validation: Validation): Validation => {
    const key = getValidationChildrenCountKey(params)
    return Validations.getFieldValidation(key)(validation)
  }

const getValidationNode =
  (params: { nodeInternalId: number }) =>
  (validation: Validation): Validation => {
    const { nodeInternalId } = params
    return Validations.getFieldValidation(String(nodeInternalId))(validation)
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
