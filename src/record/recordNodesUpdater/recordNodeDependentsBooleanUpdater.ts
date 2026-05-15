import { Node, NodePointer } from '../../node'
import { NodeDefExpression } from '../../nodeDef'
import { SurveyDependencyType } from '../../survey/survey'
import { RecordExpressionEvaluator } from '../recordExpressionEvaluator'
import { getDependentNodePointersByType } from './recordNodesDependentsUpdaterCommons'
import { RecordNodeDependentsUpdateParams } from './recordNodeDependentsUpdateParams'
import { RecordUpdateResult } from './recordUpdateResult'

const expressionEvaluator = new RecordExpressionEvaluator()

type UpdateSelfAndDependentsBooleanParams = {
  params: RecordNodeDependentsUpdateParams
  dependencyType: SurveyDependencyType
  getExpressions: (nodePointer: NodePointer) => NodeDefExpression[]
  getValuePrev: (nodeCtx: Node, nodeDefUuid: string) => boolean
  assocValue: (nodeCtx: Node, nodeDefUuid: string, value: boolean, sideEffect: boolean) => Node
  includeNewEntitySelf?: boolean
}

const calculateBooleanValueNext = async ({
  params,
  updateResult,
  nodePointer,
  nodeCtx,
  getExpressions,
  getValuePrev,
}: {
  params: RecordNodeDependentsUpdateParams
  updateResult: RecordUpdateResult
  nodePointer: NodePointer
  nodeCtx: Node
  getExpressions: (nodePointer: NodePointer) => NodeDefExpression[]
  getValuePrev: (nodeCtx: Node, nodeDefUuid: string) => boolean
}): Promise<boolean | undefined> => {
  const { nodeDef: nodeDefNodePointer } = nodePointer
  const { uuid: nodeDefUuid } = nodeDefNodePointer

  const valuePrev = getValuePrev(nodeCtx, nodeDefUuid)
  const expressionsToEvaluate = getExpressions(nodePointer)
  if (expressionsToEvaluate.length === 0) {
    if (valuePrev) {
      return undefined
    }
    return true
  }

  const exprEval = await expressionEvaluator.evalApplicableExpression({
    ...params,
    record: updateResult.record,
    nodeCtx,
    expressions: expressionsToEvaluate,
  })
  return exprEval?.value || false
}

export const updateSelfAndDependentsBoolean = async ({
  params,
  dependencyType,
  getExpressions,
  getValuePrev,
  assocValue,
  includeNewEntitySelf = true,
}: UpdateSelfAndDependentsBooleanParams): Promise<RecordUpdateResult> => {
  const { survey, record, node, sideEffect = false } = params
  const updateResult = new RecordUpdateResult({ record })

  const nodePointersToUpdate = getDependentNodePointersByType({
    survey,
    record,
    node,
    dependencyType,
    includeSelfWhenSourceIsAttribute: true,
    includeNewEntitySelf,
    includeNewEntityChildPointers: true,
  })

  // NOTE: don't do it in parallel, same nodeCtx metadata could be overwritten
  for (const nodePointer of nodePointersToUpdate) {
    const { nodeCtx: nodeCtxNodePointer, nodeDef: nodeDefNodePointer } = nodePointer

    const nodeCtxUuid = nodeCtxNodePointer.uuid
    const nodeDefUuid = nodeDefNodePointer.uuid

    const nodeCtx = updateResult.getNodeByUuid(nodeCtxUuid) ?? nodeCtxNodePointer

    const valuePrev = getValuePrev(nodeCtx, nodeDefUuid)
    const value = await calculateBooleanValueNext({
      params,
      updateResult,
      nodePointer,
      nodeCtx,
      getExpressions,
      getValuePrev,
    })

    if (value === undefined || valuePrev === value) {
      continue
    }

    const nodeCtxUpdated = assocValue(nodeCtx, nodeDefUuid, value, sideEffect)
    updateResult.addNode(nodeCtxUpdated, { sideEffect })
  }

  return updateResult
}
