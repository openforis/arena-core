import { Node, NodePointer, Nodes } from '../../node'
import { NodeDefs } from '../../nodeDef'
import { SurveyDependencyType } from '../../survey/survey'
import { RecordExpressionEvaluator } from '../recordExpressionEvaluator'
import { RecordUpdateOptions } from '../records'
import { getDependentNodePointersByType } from './recordNodesDependentsUpdaterCommons'
import { RecordNodeDependentsUpdateParams } from './recordNodeDependentsUpdateParams'
import { RecordUpdateResult } from './recordUpdateResult'

const expressionEvaluator = new RecordExpressionEvaluator()

const calculateVisibleNext = async ({
  params,
  updateResult,
  nodePointer,
  nodeCtx,
}: {
  params: RecordNodeDependentsUpdateParams
  updateResult: RecordUpdateResult
  nodePointer: NodePointer
  nodeCtx: Node
}): Promise<boolean | undefined> => {
  const { nodeDef: nodeDefNodePointer } = nodePointer
  const { uuid: nodeDefUuid } = nodeDefNodePointer

  const visiblePrev = Nodes.isChildVisible(nodeCtx, nodeDefUuid)
  const expressionsToEvaluate = NodeDefs.getVisibleWhen(nodeDefNodePointer)
  if (expressionsToEvaluate.length === 0) {
    if (visiblePrev) {
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

export const updateSelfAndDependentsVisible = async (
  params: RecordNodeDependentsUpdateParams
): Promise<RecordUpdateResult> => {
  const { survey, record, node, sideEffect = false } = params

  const updateResult = new RecordUpdateResult({ record })
  const recordUpdateOptions: RecordUpdateOptions = { sideEffect }

  const nodePointersToUpdate = getDependentNodePointersByType({
    survey,
    record,
    node,
    dependencyType: SurveyDependencyType.visible,
    includeSelfWhenSourceIsAttribute: true,
  })

  // NOTE: don't do it in parallel, same nodeCtx metadata could be overwritten
  for (const nodePointer of nodePointersToUpdate) {
    const { nodeCtx: nodeCtxNodePointer, nodeDef: nodeDefNodePointer } = nodePointer

    const nodeCtxUuid = nodeCtxNodePointer.uuid
    const nodeDefUuid = nodeDefNodePointer.uuid

    const nodeCtx = updateResult.getNodeByUuid(nodeCtxUuid) ?? nodeCtxNodePointer

    const visiblePrev = Nodes.isChildVisible(nodeCtx, nodeDefUuid)
    const visible = await calculateVisibleNext({
      params,
      updateResult,
      nodePointer,
      nodeCtx,
    })

    if (visible === undefined || visiblePrev === visible) {
      continue
    }

    const nodeCtxUpdated = Nodes.assocChildVisible(nodeCtx, nodeDefUuid, visible, sideEffect)
    updateResult.addNode(nodeCtxUpdated, recordUpdateOptions)
  }

  return updateResult
}
