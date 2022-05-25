import { SystemError } from '../../error'
import { NodeDef, NodeDefExpression, NodeDefProps, NodeDefs, NodeDefType } from '../../nodeDef'
import { Record } from '../record'
import { Survey } from '../../survey'
import { Node, NodePointer, Nodes } from '../../node'
import { Objects } from '../../utils'
import { SurveyDependencyType } from '../../survey/survey'
import { RecordUpdateResult } from './recordUpdateResult'
import { Records } from '../records'
import { RecordExpressionValueConverter } from './recordExpressionValueConverter'
import { RecordExpressionEvaluator } from '../recordExpressionEvaluator'
import { NodePointers } from '../nodePointers'

const _throwError = (params: {
  error: any
  expressionType: SurveyDependencyType
  survey: Survey
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
  expressionsToEvaluate: NodeDefExpression[]
}) => {
  const { error, expressionType, survey, nodeDef, expressionsToEvaluate } = params
  const nodeDefName = nodeDef.props.name
  const expressionsString = JSON.stringify(expressionsToEvaluate)

  throw new SystemError('record.updateSelfAndDependentsApplicable.', {
    surveyName: survey.props.name,
    nodeDefName,
    expressionType,
    expressionsString,
    error: error.toString(),
  })
}

/**
 * Module responsible for updating applicable and default values.
 */

export const updateSelfAndDependentsApplicable = (params: {
  survey: Survey
  record: Record
  node: Node
}): RecordUpdateResult => {
  const { survey, record, node } = params
  const updateResult = new RecordUpdateResult({ record })

  // 1. fetch dependent nodes
  const nodePointersToUpdate = Records.getDependentNodePointers({
    survey,
    record,
    node,
    dependencyType: SurveyDependencyType.applicable,
  })

  // if (Node.isCreated(node) && !Objects.isEmpty(nodeDef.propsAdvanced?.applicable)) {
  //   // Include a pointer to node itself if it has just been created and it has an "applicable if" expression
  //   nodePointersToUpdate.push({
  //     nodeDef,
  //     nodeCtx: Records.getParent({ record, node }),
  //   })
  // }

  // 2. update expr to node and dependent nodes
  // NOTE: don't do it in parallel, same nodeCtx metadata could be overwritten
  nodePointersToUpdate.forEach((nodePointer: NodePointer) => {
    const { nodeCtx: nodeCtxNodePointer, nodeDef: nodeDefNodePointer } = nodePointer

    const expressionsToEvaluate = NodeDefs.getApplicable(nodeDefNodePointer)
    if (expressionsToEvaluate.length === 0) return

    // 3. evaluate applicable expression
    const nodeCtxUuid = nodeCtxNodePointer.uuid
    // nodeCtx could have been updated in a previous iteration
    const nodeCtx = updateResult.getNodeByUuid(nodeCtxUuid) || nodeCtxNodePointer

    const exprEval = new RecordExpressionEvaluator().evalApplicableExpression({
      survey,
      record: updateResult.record,
      nodeCtx,
      expressions: expressionsToEvaluate,
    })

    const applicable = exprEval?.value || false

    // 4. persist updated node value if changed, and return updated node
    const nodeDefUuid = nodeDefNodePointer.uuid

    if (Nodes.isChildApplicable(nodeCtx, nodeDefUuid) !== applicable) {
      // Applicability changed

      // update node and add it to nodes updated
      const nodeCtxUpdated = Nodes.assocChildApplicability(nodeCtx, nodeDefUuid, applicable)
      updateResult.addNode(nodeCtxUpdated)

      const nodeCtxChildren = Records.getChildren({
        record: updateResult.record,
        parentNode: nodeCtx,
        childDefUuid: nodeDefUuid,
      })
      nodeCtxChildren.forEach((nodeCtxChild) => {
        // 5. add nodeCtxChild and its descendants to nodesUpdated
        Records.visitDescendantsAndSelf({
          record: updateResult.record,
          node: nodeCtxChild,
          visitor: (nodeDescendant) => {
            updateResult.addNode(nodeDescendant)
          },
        })
      })
    }
  })

  return updateResult
}

const canApplyDefaultValue = (node: Node): boolean => Nodes.isValueBlank(node) || Nodes.isDefaultValueApplied(node)

const updateDefaultValuesInNodes = (params: {
  survey: Survey
  record: Record
  nodePointer: NodePointer
  updateResult: RecordUpdateResult
}) => {
  const { survey, record, nodePointer, updateResult } = params

  const { nodeCtx, nodeDef } = nodePointer

  const expressionsToEvaluate = NodeDefs.getDefaultValues(nodeDef)
  if (expressionsToEvaluate.length === 0) return

  try {
    // 1. evaluate applicable default value expression
    const exprEval = new RecordExpressionEvaluator().evalApplicableExpression({
      survey,
      record,
      nodeCtx,
      expressions: expressionsToEvaluate,
    })

    const exprEvalValue = exprEval?.value
    const exprValue = Objects.isEmpty(exprEvalValue)
      ? null
      : RecordExpressionValueConverter.toNodeValue({
          survey,
          record,
          nodeDef,
          nodeParent: nodeCtx,
          valueExpr: exprEvalValue,
        })

    const nodesToUpdate = NodePointers.getNodesFromNodePointers({ record, nodePointers: [nodePointer] })
    nodesToUpdate.forEach((nodeToUpdate) => {
      if (!canApplyDefaultValue(nodeToUpdate)) return

      // 2. if node value is not changed, do nothing
      if (Objects.isEqual(nodeToUpdate.value, exprValue)) return

      // 3. update node value and meta
      const defaultValueApplied = !Objects.isEmpty(exprValue)

      const nodeUpdated = Nodes.mergeNodes(nodeToUpdate, {
        value: exprValue,
        meta: { defaultValueApplied },
      })

      updateResult.addNode(nodeUpdated)
    })
  } catch (error) {
    _throwError({
      error,
      expressionType: SurveyDependencyType.defaultValues,
      survey,
      nodeDef,
      expressionsToEvaluate,
    })
  }
}

export const updateSelfAndDependentsDefaultValues = (params: { survey: Survey; record: Record; node: Node }) => {
  const { survey, record, node } = params

  const updateResult = new RecordUpdateResult({ record })

  // 1. get dependent node pointers

  // filter nodes to update including itself and (attributes with empty values or with default values applied)
  // therefore attributes with user defined values are excluded
  const nodePointersFilterFn = (nodePointer: NodePointer): boolean => {
    if (!NodeDefs.isAttribute(nodePointer.nodeDef)) return false

    const referencedNodes = NodePointers.getNodesFromNodePointers({ record, nodePointers: [nodePointer] })
    return referencedNodes.some(canApplyDefaultValue)
  }

  const nodePointersToUpdate = Records.getDependentNodePointers({
    survey,
    record,
    node,
    dependencyType: SurveyDependencyType.defaultValues,
    includeSelf: true,
    filterFn: nodePointersFilterFn,
  })

  // 2. update expr to node and dependent nodes
  nodePointersToUpdate.forEach((nodePointer) => {
    updateDefaultValuesInNodes({ survey, record, nodePointer, updateResult })
  })

  return updateResult
}
