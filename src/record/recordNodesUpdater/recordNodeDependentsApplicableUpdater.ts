import { Nodes } from '../../node'
import { NodeDefEntity, NodeDefs } from '../../nodeDef'
import { Surveys } from '../../survey'
import { SurveyDependencyType } from '../../survey/survey'
import { RecordExpressionEvaluator } from '../recordExpressionEvaluator'
import { Records } from '../records'
import { createOrDeleteEnumeratedEntities } from './recordNodeDependentsEnumeratedEntitiesUpdater'
import { RecordNodeDependentsUpdateParams } from './recordNodeDependentsUpdateParams'
import { RecordUpdateResult } from './recordUpdateResult'

const expressionEvaluator = new RecordExpressionEvaluator()

export const updateSelfAndDependentsApplicable = async (
  params: RecordNodeDependentsUpdateParams
): Promise<RecordUpdateResult> => {
  const { survey, record, node, sideEffect = false } = params

  const updateResult = new RecordUpdateResult({ record })

  const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: node.nodeDefUuid })

  // 1. fetch dependent nodes
  const nodePointersToUpdate = Records.getDependentNodePointers({
    survey,
    record,
    node,
    dependencyType: SurveyDependencyType.applicable,
    includeSelf: !NodeDefs.isEntity(nodeDef),
  })

  // 2. update expr to node and dependent nodes
  // NOTE: don't do it in parallel, same nodeCtx metadata could be overwritten
  for await (const nodePointer of nodePointersToUpdate) {
    const { nodeCtx: nodeCtxNodePointer, nodeDef: nodeDefNodePointer } = nodePointer

    const expressionsToEvaluate = NodeDefs.getApplicable(nodeDefNodePointer)
    if (expressionsToEvaluate.length === 0) continue

    // 3. evaluate applicable expression
    const nodeCtxUuid = nodeCtxNodePointer.uuid
    // nodeCtx could have been updated in a previous iteration
    const nodeCtx = updateResult.getNodeByUuid(nodeCtxUuid) ?? nodeCtxNodePointer

    const exprEval = await expressionEvaluator.evalApplicableExpression({
      ...params,
      record: updateResult.record,
      nodeCtx,
      expressions: expressionsToEvaluate,
    })

    const applicable = exprEval?.value || false

    // 4. persist updated applicability if changed, and return updated nodes
    const nodeDefUuid = nodeDefNodePointer.uuid

    if (Nodes.isChildApplicable(nodeCtx, nodeDefUuid) !== applicable) {
      // Applicability changed

      // update node and add it to nodes updated
      const nodeCtxUpdated = Nodes.assocChildApplicability(nodeCtx, nodeDefUuid, applicable)
      updateResult.addNode(nodeCtxUpdated, { sideEffect })

      let nodeCtxChildren = Records.getChildren(nodeCtx, nodeDefUuid)(updateResult.record)

      if (NodeDefs.isMultipleEntity(nodeDefNodePointer) && NodeDefs.isEnumerate(nodeDefNodePointer as NodeDefEntity)) {
        createOrDeleteEnumeratedEntities({
          ...params,
          parentNode: nodeCtxUpdated,
          entityDef: nodeDefNodePointer as NodeDefEntity,
          updateResult,
        })
        nodeCtxChildren = Records.getChildren(nodeCtx, nodeDefUuid)(updateResult.record)
      }
      nodeCtxChildren.forEach((nodeCtxChild) => {
        // add nodeCtxChild and its descendants to nodesUpdated
        Records.visitDescendantsAndSelf({
          record: updateResult.record,
          node: nodeCtxChild,
          visitor: (nodeDescendant): boolean => {
            updateResult.addNode(nodeDescendant, { sideEffect })
            return false
          },
        })
      })
    }
  }
  return updateResult
}
