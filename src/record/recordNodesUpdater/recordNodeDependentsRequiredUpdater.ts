import { ArenaRecordNode, Nodes } from '../../node'
import { NodeDef, NodeDefs, NodeDefType } from '../../nodeDef'
import { Surveys } from '../../survey'
import { SurveyDependencyType } from '../../survey/survey'
import { getNodesByDefUuid } from '../_records/recordGetters'
import { RecordExpressionEvaluator } from '../recordExpressionEvaluator'
import { RecordExpressionEvaluationContext } from './recordExpressionEvaluationContext'
import { getDependentNodePointersByType } from './recordNodesDependentsUpdaterCommons'
import { RecordNodeDependentsUpdateParams } from './recordNodeDependentsUpdateParams'
import { RecordUpdateResult } from './recordUpdateResult'

const expressionEvaluator = new RecordExpressionEvaluator()

/**
 * Evaluates the "required if" condition of the specified child def in the context of the specified parent entity.
 */
export const evaluateRequiredIf = async (
  params: RecordExpressionEvaluationContext & {
    nodeCtx: ArenaRecordNode
    nodeDef: NodeDef<NodeDefType>
  }
): Promise<boolean> => {
  const { nodeCtx, nodeDef } = params
  const exprEval = await expressionEvaluator.evalApplicableExpression({
    ...params,
    nodeCtx,
    expressions: NodeDefs.getRequiredIf(nodeDef),
  })
  return !!exprEval?.value
}

/**
 * Updates the "required if" flags (parent node meta `cReq`) of the node itself (if attribute) and of its dependents.
 * Flags are stored only for child defs with a "required if" condition.
 */
export const updateSelfAndDependentsRequired = async (
  params: RecordNodeDependentsUpdateParams
): Promise<RecordUpdateResult> => {
  const { survey, record, node, sideEffect = false } = params
  const updateResult = new RecordUpdateResult({ record })

  const nodePointersToUpdate = getDependentNodePointersByType({
    survey,
    record,
    node,
    dependencyType: SurveyDependencyType.required,
    includeSelfWhenSourceIsAttribute: true,
    filterFn: (nodePointer) => NodeDefs.isRequiredIfDefined(nodePointer.nodeDef),
  })

  // NOTE: don't do it in parallel, same nodeCtx metadata could be overwritten
  for (const { nodeCtx: nodeCtxNodePointer, nodeDef } of nodePointersToUpdate) {
    const nodeCtx = updateResult.getNodeByUuid(nodeCtxNodePointer.uuid) ?? nodeCtxNodePointer
    const valuePrev = Nodes.getChildRequired(nodeCtx, nodeDef.uuid)
    // NOSONAR: sequential evaluation needed (see note above)
    const value = await evaluateRequiredIf({ ...params, record: updateResult.record, nodeCtx, nodeDef }) // NOSONAR
    if (valuePrev === value) continue

    const nodeCtxUpdated = Nodes.assocChildRequired(nodeCtx, nodeDef.uuid, value, { sideEffect })
    updateResult.addNode(nodeCtxUpdated, { sideEffect })
  }
  return updateResult
}

/**
 * Recomputes the "required if" flags (parent node meta `cReq`) of the specified node defs in the whole record,
 * e.g. after their "required if" condition has been added, changed or removed (flags are removed when the node def
 * has no condition anymore). Validation is not updated.
 */
export const updateRequiredFlags = async (
  params: RecordExpressionEvaluationContext & { nodeDefUuids: string[] }
): Promise<RecordUpdateResult> => {
  const { survey, record, nodeDefUuids, sideEffect = false } = params
  const updateResult = new RecordUpdateResult({ record })

  for (const nodeDefUuid of nodeDefUuids) {
    const nodeDef = Surveys.findNodeDefByUuid({ survey, uuid: nodeDefUuid })
    if (!nodeDef || !nodeDef.parentUuid) continue
    const requiredIfDefined = NodeDefs.isRequiredIfDefined(nodeDef)
    const parentNodes = getNodesByDefUuid(nodeDef.parentUuid)(updateResult.record)

    for (const parentNode of parentNodes) {
      const nodeCtx = updateResult.getNodeByUuid(parentNode.uuid) ?? parentNode
      const valuePrev = Nodes.getChildRequired(nodeCtx, nodeDefUuid)
      let nodeCtxUpdated: ArenaRecordNode | undefined = undefined
      if (requiredIfDefined) {
        // sequential evaluation: the same parent node can be updated for different child defs
        const value = await evaluateRequiredIf({ ...params, record: updateResult.record, nodeCtx, nodeDef }) // NOSONAR
        if (value !== valuePrev) {
          nodeCtxUpdated = Nodes.assocChildRequired(nodeCtx, nodeDefUuid, value, { sideEffect })
        }
      } else if (valuePrev !== undefined) {
        nodeCtxUpdated = Nodes.dissocChildRequired(nodeCtx, nodeDefUuid, { sideEffect })
      }
      if (nodeCtxUpdated) {
        updateResult.addNode(nodeCtxUpdated, { sideEffect })
      }
    }
  }
  return updateResult
}
