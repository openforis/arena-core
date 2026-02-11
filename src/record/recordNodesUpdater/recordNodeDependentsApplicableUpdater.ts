import { Node, NodePointer, Nodes } from '../../node'
import { NodeDefEntity, NodeDefs } from '../../nodeDef'
import { Surveys } from '../../survey'
import { Survey, SurveyDependencyType } from '../../survey/survey'
import { Record } from '../record'
import { RecordExpressionEvaluator } from '../recordExpressionEvaluator'
import { Records } from '../records'
import { createOrDeleteEnumeratedEntities } from './recordNodeDependentsEnumeratedEntitiesUpdater'
import { RecordNodeDependentsUpdateParams } from './recordNodeDependentsUpdateParams'
import { RecordUpdateResult } from './recordUpdateResult'

const expressionEvaluator = new RecordExpressionEvaluator()

const extractNodePointersToUpdate = (params: { survey: Survey; record: Record; node: Node }) => {
  const { survey, record, node } = params

  const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: node.nodeDefUuid })

  const nodePointersToUpdate = Records.getDependentNodePointers({
    survey,
    record,
    node,
    dependencyType: SurveyDependencyType.applicable,
    includeSelf: !NodeDefs.isEntity(nodeDef),
  })

  if (NodeDefs.isEntity(nodeDef) && node.created) {
    // for new entities, include children multiple nodes (to update their applicability too, in case they are empty)
    const multipleNodeDefs = Surveys.getNodeDefChildren({ survey, nodeDef }).filter(NodeDefs.isMultiple)
    for (const childDef of multipleNodeDefs) {
      nodePointersToUpdate.push({ nodeCtx: node, nodeDef: childDef })
    }
  }
  return nodePointersToUpdate
}

const calculateApplicableNext = async ({
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

  const applicablePrev = Nodes.isChildApplicable(nodeCtx, nodeDefUuid)
  const expressionsToEvaluate = NodeDefs.getApplicable(nodeDefNodePointer)
  if (expressionsToEvaluate.length === 0) {
    if (applicablePrev) {
      // skip nodes that were already applicable and have no applicable expression, as they will remain applicable
      return undefined
    } else {
      // used during survey publishing: node def could have had applicable expression(s) that were removed,
      // and node could have been not applicable, but now it should be applicable, as there are no more applicable expressions
      return true
    }
  } else {
    // 3. evaluate applicable expression
    const exprEval = await expressionEvaluator.evalApplicableExpression({
      ...params,
      record: updateResult.record,
      nodeCtx,
      expressions: expressionsToEvaluate,
    })
    return exprEval?.value || false
  }
}

export const updateSelfAndDependentsApplicable = async (
  params: RecordNodeDependentsUpdateParams
): Promise<RecordUpdateResult> => {
  const { survey, record, node, sideEffect = false } = params

  const updateResult = new RecordUpdateResult({ record })

  // 1. fetch dependent nodes
  const nodePointersToUpdate = extractNodePointersToUpdate({ survey, record, node })

  // 2. update expr to node and dependent nodes
  // NOTE: don't do it in parallel, same nodeCtx metadata could be overwritten
  for (const nodePointer of nodePointersToUpdate) {
    const { nodeCtx: nodeCtxNodePointer, nodeDef: nodeDefNodePointer } = nodePointer

    const nodeCtxUuid = nodeCtxNodePointer.uuid
    const nodeDefUuid = nodeDefNodePointer.uuid

    // nodeCtx could have been updated in a previous iteration
    const nodeCtx = updateResult.getNodeByUuid(nodeCtxUuid) ?? nodeCtxNodePointer

    const applicablePrev = Nodes.isChildApplicable(nodeCtx, nodeDefUuid)
    const applicable = await calculateApplicableNext({
      params,
      updateResult,
      nodePointer,
      nodeCtx,
    })
    if (applicable === undefined) {
      continue
    }
    // 4. persist updated applicability if changed, and return updated nodes

    if (applicablePrev !== applicable) {
      // Applicability changed

      // update node and add it to nodes updated
      const nodeCtxUpdated = Nodes.assocChildApplicability(nodeCtx, nodeDefUuid, applicable)
      updateResult.addNode(nodeCtxUpdated, { sideEffect })

      let nodeCtxChildren = Records.getChildren(nodeCtx, nodeDefUuid)(updateResult.record)

      if (NodeDefs.isMultipleEntity(nodeDefNodePointer) && NodeDefs.isEnumerate(nodeDefNodePointer as NodeDefEntity)) {
        await createOrDeleteEnumeratedEntities({
          ...params,
          parentNode: nodeCtxUpdated,
          entityDef: nodeDefNodePointer as NodeDefEntity,
          updateResult,
        })
        nodeCtxChildren = Records.getChildren(nodeCtx, nodeDefUuid)(updateResult.record)
      }
      for (const nodeCtxChild of nodeCtxChildren) {
        // add nodeCtxChild and its descendants to nodesUpdated
        Records.visitDescendantsAndSelf({
          record: updateResult.record,
          node: nodeCtxChild,
          visitor: (nodeDescendant): boolean => {
            updateResult.addNode(nodeDescendant, { sideEffect })
            return false
          },
        })
      }
    }
  }
  return updateResult
}
