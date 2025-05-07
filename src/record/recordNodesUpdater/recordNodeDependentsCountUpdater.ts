import { Nodes } from '../../node'
import { NodeDefCountType, NodeDefs } from '../../nodeDef'
import { SurveyDependencyType } from '../../survey'
import { Objects } from '../../utils'
import { RecordExpressionEvaluator } from '../recordExpressionEvaluator'
import { Records } from '../records'
import { RecordNodeDependentsUpdateParams } from './recordNodeDependentsUpdateParams'
import { RecordUpdateResult } from './recordUpdateResult'

const expressionEvaluator = new RecordExpressionEvaluator()

export const updateDependentsCount = async (
  params: RecordNodeDependentsUpdateParams & {
    countType: NodeDefCountType
  }
): Promise<RecordUpdateResult> => {
  const { survey, record, node, countType, sideEffect = false } = params

  const updateResult = new RecordUpdateResult({ record })

  // 1. fetch dependent nodes
  const dependencyType =
    countType === NodeDefCountType.max ? SurveyDependencyType.maxCount : SurveyDependencyType.minCount

  const nodePointersToUpdate = Records.getDependentNodePointers({
    survey,
    record,
    node,
    dependencyType,
  })

  // 2. update expr to node and dependent nodes
  // NOTE: don't do it in parallel, same nodeCtx metadata could be overwritten
  for (const nodePointer of nodePointersToUpdate) {
    const { nodeCtx: nodeCtxNodePointer, nodeDef: nodeDefNodePointer } = nodePointer

    const expressionsToEvaluate = NodeDefs.getCount(nodeDefNodePointer, countType)
    if (Objects.isEmpty(expressionsToEvaluate) || !Array.isArray(expressionsToEvaluate)) continue

    // 3. evaluate applicable expression
    const nodeCtxUuid = nodeCtxNodePointer.uuid
    // nodeCtx could have been updated in a previous iteration
    const nodeCtx = updateResult.getNodeByUuid(nodeCtxUuid) ?? nodeCtxNodePointer

    const countResult = await expressionEvaluator.evalApplicableExpression({
      ...params,
      record: updateResult.record,
      nodeCtx,
      expressions: expressionsToEvaluate,
    })

    const count = Number(countResult?.value)

    // 4. persist updated count if changed, and return updated nodes
    const nodeDefUuid = nodeDefNodePointer.uuid

    if (Nodes.getChildrenCount({ parentNode: nodeCtx, nodeDef: nodeDefNodePointer, countType }) !== count) {
      // count changed

      // 5. update node and add it to nodes updated
      const nodeCtxUpdated = Nodes.assocChildrenCount({ node: nodeCtx, nodeDefUuid, count, countType })
      updateResult.addNode(nodeCtxUpdated, { sideEffect })
    }
  }
  return updateResult
}
