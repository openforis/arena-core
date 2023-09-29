import { NodeDefs } from '../../nodeDef'
import { Record } from '../record'
import { Survey } from '../../survey'
import { Node, NodePointer, Nodes } from '../../node'
import { SurveyDependencyType } from '../../survey/survey'
import { RecordUpdateResult } from './recordUpdateResult'
import { Records } from '../records'
import { RecordExpressionEvaluator } from '../recordExpressionEvaluator'

export const updateSelfAndDependentsApplicable = (params: {
  survey: Survey
  record: Record
  node: Node
  sideEffect?: boolean
  timezoneOffset?: number
}): RecordUpdateResult => {
  const { survey, record, node, timezoneOffset, sideEffect = false } = params

  const updateResult = new RecordUpdateResult({ record })

  // 1. fetch dependent nodes
  const nodePointersToUpdate = Records.getDependentNodePointers({
    survey,
    record,
    node,
    dependencyType: SurveyDependencyType.applicable,
    includeSelf: node.created,
  })

  // 2. update expr to node and dependent nodes
  // NOTE: don't do it in parallel, same nodeCtx metadata could be overwritten
  nodePointersToUpdate.forEach((nodePointer: NodePointer) => {
    const { nodeCtx: nodeCtxNodePointer, nodeDef: nodeDefNodePointer } = nodePointer

    const expressionsToEvaluate = NodeDefs.getApplicable(nodeDefNodePointer)
    if (expressionsToEvaluate.length === 0) return

    // 3. evaluate applicable expression
    const nodeCtxUuid = nodeCtxNodePointer.uuid
    // nodeCtx could have been updated in a previous iteration
    const nodeCtx = updateResult.getNodeByUuid(nodeCtxUuid) ?? nodeCtxNodePointer

    const exprEval = new RecordExpressionEvaluator().evalApplicableExpression({
      survey,
      record: updateResult.record,
      nodeCtx,
      expressions: expressionsToEvaluate,
      timezoneOffset,
    })

    const applicable = exprEval?.value || false

    // 4. persist updated applicability if changed, and return updated nodes
    const nodeDefUuid = nodeDefNodePointer.uuid

    if (Nodes.isChildApplicable(nodeCtx, nodeDefUuid) !== applicable) {
      // Applicability changed

      // update node and add it to nodes updated
      const nodeCtxUpdated = Nodes.assocChildApplicability(nodeCtx, nodeDefUuid, applicable)
      updateResult.addNode(nodeCtxUpdated, { sideEffect })

      const nodeCtxChildren = Records.getChildren(nodeCtx, nodeDefUuid)(updateResult.record)
      nodeCtxChildren.forEach((nodeCtxChild) => {
        // 6. add nodeCtxChild and its descendants to nodesUpdated
        Records.visitDescendantsAndSelf({
          record: updateResult.record,
          node: nodeCtxChild,
          visitor: (nodeDescendant) => {
            updateResult.addNode(nodeDescendant, { sideEffect })
          },
        })
      })
    }
  })

  return updateResult
}
