import { SystemError } from '../../error'
import { Node, NodePointer, Nodes } from '../../node'
import { NodeDefEntity, NodeDefs } from '../../nodeDef'
import { Surveys } from '../../survey'
import { SurveyDependencyType } from '../../survey/survey'
import { RecordExpressionEvaluator } from '../recordExpressionEvaluator'
import { Records } from '../records'
import { ExpressionEvaluationContext } from './expressionEvaluationContext'
import { createEnumeratedEntityNodes } from './recordNodesCreator'
import { deleteNodes } from './recordNodesDeleter'
import { RecordUpdateResult } from './recordUpdateResult'

const recordExpressionEvaluator = new RecordExpressionEvaluator()

export const createOrDeleteEnumeratedEntities = (
  params: ExpressionEvaluationContext & {
    parentNode: Node
    entityDef: NodeDefEntity
    updateResult: RecordUpdateResult
  }
) => {
  const { user, survey, parentNode, entityDef, updateResult, sideEffect, deleteNotApplicableEnumeratedEntities } =
    params
  const nodeCtxChildren = Records.getChildren(parentNode, entityDef.uuid)(updateResult.record)
  const childrenCount = nodeCtxChildren.length
  const applicable = Nodes.isChildApplicable(parentNode, entityDef.uuid)
  if (applicable && childrenCount === 0) {
    createEnumeratedEntityNodes({
      user,
      survey,
      entityDef,
      parentNode,
      updateResult,
      sideEffect,
    })
  } else if (!applicable && childrenCount > 0) {
    if (deleteNotApplicableEnumeratedEntities) {
      const nodesDeleteUpdatedResult = deleteNodes(
        nodeCtxChildren.map((node) => node.uuid),
        { sideEffect }
      )(updateResult.record)
      updateResult.merge(nodesDeleteUpdatedResult)
    } else {
      throw new SystemError('record.dependentEnumeratedEntitiesBecameNotRelevant', {
        nodeDefName: NodeDefs.getName(entityDef),
      })
    }
  }
}

export const updateSelfAndDependentsApplicable = (
  params: ExpressionEvaluationContext & {
    node: Node
  }
): RecordUpdateResult => {
  const { user, survey, record, node, timezoneOffset, sideEffect = false } = params

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
  nodePointersToUpdate.forEach((nodePointer: NodePointer) => {
    const { nodeCtx: nodeCtxNodePointer, nodeDef: nodeDefNodePointer } = nodePointer

    const expressionsToEvaluate = NodeDefs.getApplicable(nodeDefNodePointer)
    if (expressionsToEvaluate.length === 0) return

    // 3. evaluate applicable expression
    const nodeCtxUuid = nodeCtxNodePointer.uuid
    // nodeCtx could have been updated in a previous iteration
    const nodeCtx = updateResult.getNodeByUuid(nodeCtxUuid) ?? nodeCtxNodePointer

    const exprEval = recordExpressionEvaluator.evalApplicableExpression({
      user,
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

      let nodeCtxChildren = Records.getChildren(nodeCtx, nodeDefUuid)(updateResult.record)

      if (NodeDefs.isMultipleEntity(nodeDefNodePointer) && NodeDefs.isEnumerate(nodeDefNodePointer as NodeDefEntity)) {
        createOrDeleteEnumeratedEntities({
          ...params,
          parentNode: nodeCtx,
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
          visitor: (nodeDescendant) => {
            updateResult.addNode(nodeDescendant, { sideEffect })
          },
        })
      })
    }
  })

  return updateResult
}
