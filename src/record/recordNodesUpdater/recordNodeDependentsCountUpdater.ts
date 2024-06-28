import { NodeDefCountType, NodeDefs } from '../../nodeDef'
import { Record } from '../record'
import { Survey, SurveyDependencyType } from '../../survey'
import { Node, NodePointer, Nodes } from '../../node'
import { RecordUpdateResult } from './recordUpdateResult'
import { Records } from '../records'
import { RecordExpressionEvaluator } from '../recordExpressionEvaluator'
import { Objects } from '../../utils'

export const updateDependentsCount = (params: {
  survey: Survey
  record: Record
  node: Node
  countType: NodeDefCountType
  sideEffect?: boolean
  timezoneOffset?: number
}): RecordUpdateResult => {
  const { survey, record, node, countType, timezoneOffset, sideEffect = false } = params

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
  nodePointersToUpdate.forEach((nodePointer: NodePointer) => {
    const { nodeCtx: nodeCtxNodePointer, nodeDef: nodeDefNodePointer } = nodePointer

    const expressionToEvaluate = NodeDefs.getCount(nodeDefNodePointer, countType)
    if (Objects.isEmpty(expressionToEvaluate)) return

    // 3. evaluate applicable expression
    const nodeCtxUuid = nodeCtxNodePointer.uuid
    // nodeCtx could have been updated in a previous iteration
    const nodeCtx = updateResult.getNodeByUuid(nodeCtxUuid) ?? nodeCtxNodePointer

    const count = new RecordExpressionEvaluator().evalExpression({
      survey,
      record: updateResult.record,
      node: nodeCtx,
      query: expressionToEvaluate!,
      timezoneOffset,
    })

    // 4. persist updated count if changed, and return updated nodes
    const nodeDefUuid = nodeDefNodePointer.uuid

    if (Nodes.getChildrenCount({ parentNode: nodeCtx, nodeDef: nodeDefNodePointer, countType }) !== count) {
      // count changed

      // 5. update node and add it to nodes updated
      const nodeCtxUpdated = Nodes.assocChildrenCount({ node: nodeCtx, nodeDefUuid, count, countType })
      updateResult.addNode(nodeCtxUpdated, { sideEffect })
    }
  })

  return updateResult
}
