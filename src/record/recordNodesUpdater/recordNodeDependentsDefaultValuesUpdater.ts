import { Node, NodePointer, Nodes } from '../../node'
import { NodeDef, NodeDefs } from '../../nodeDef'
import { SurveyDependencyType } from '../../survey/survey'
import { Dates, Objects } from '../../utils'
import { NodePointers } from '../nodePointers'
import { Record } from '../record'
import { RecordExpressionEvaluator } from '../recordExpressionEvaluator'
import { Records } from '../records'
import { RecordExpressionValueConverter } from './recordExpressionValueConverter'
import { RecordNodeDependentsUpdateParams } from './recordNodeDependentsUpdateParams'
import { throwError } from './recordNodesDependentsUpdaterCommons'
import { RecordUpdateResult } from './recordUpdateResult'

const expressionEvaluator = new RecordExpressionEvaluator()

const shouldResetDefaultValue = (params: { record: Record; node: Node }): boolean => {
  const { record, node } = params
  return !Records.isNodeApplicable({ record, node }) && !Nodes.isValueBlank(node) && Nodes.isDefaultValueApplied(node)
}

const canApplyDefaultValue = (params: { record: Record; node: Node; nodeDef: NodeDef<any> }): boolean => {
  const { record, node, nodeDef } = params
  return (
    Records.isNodeApplicable({ record, node }) &&
    (Nodes.isValueBlank(node) ||
      (Nodes.isDefaultValueApplied(node) && !NodeDefs.isDefaultValueEvaluatedOneTime(nodeDef)))
  )
}

const updateDefaultValuesInNodes = async (
  params: RecordNodeDependentsUpdateParams & {
    nodePointer: NodePointer
    updateResult: RecordUpdateResult
  }
): Promise<void> => {
  const { survey, nodePointer, updateResult, timezoneOffset, categoryItemProvider, sideEffect = false } = params

  const { nodeCtx, nodeDef } = nodePointer

  if (nodeCtx.deleted) return

  const expressionsToEvaluate = NodeDefs.getDefaultValues(nodeDef)
  if (expressionsToEvaluate.length === 0) return

  const { record } = updateResult

  try {
    // 1. evaluate applicable default value expression
    const exprEval = await expressionEvaluator.evalApplicableExpression({
      ...params,
      record,
      nodeCtx,
      expressions: expressionsToEvaluate,
    })

    const exprEvalValue = exprEval?.value
    const exprValue = Objects.isEmpty(exprEvalValue)
      ? null
      : await RecordExpressionValueConverter.toNodeValue({
          survey,
          record,
          nodeDef,
          nodeParent: nodeCtx,
          valueExpr: exprEvalValue,
          timezoneOffset,
          categoryItemProvider,
        })

    const nodesToUpdate = NodePointers.getNodesFromNodePointers({ record, nodePointers: [nodePointer] })
    nodesToUpdate.forEach((nodeToUpdate) => {
      if (shouldResetDefaultValue({ record: updateResult.record, node: nodeToUpdate })) {
        const nodeUpdated = Nodes.mergeNodes(nodeToUpdate, {
          value: null,
          meta: { defaultValueApplied: false },
          updated: true,
          dateModified: Dates.nowFormattedForStorage(),
        })
        updateResult.addNode(nodeUpdated, { sideEffect })
        return
      }
      if (!canApplyDefaultValue({ record: updateResult.record, nodeDef, node: nodeToUpdate })) return

      // 2. if node value is not changed, do nothing
      if (Objects.isEqual(nodeToUpdate.value, exprValue)) return

      // 3. update node value and meta
      const defaultValueApplied = !Objects.isEmpty(exprValue)

      const nodeUpdated = Nodes.mergeNodes(nodeToUpdate, {
        value: exprValue,
        meta: { defaultValueApplied },
        updated: true,
        dateModified: Dates.nowFormattedForStorage(),
      })
      updateResult.addNode(nodeUpdated, { sideEffect })
    })
  } catch (error) {
    throwError({
      error,
      errorKey: 'record.updateSelfAndDependentsDefaultValues',
      expressionType: SurveyDependencyType.defaultValues,
      survey,
      nodeDef,
      expressionsToEvaluate,
    })
  }
}

export const updateSelfAndDependentsDefaultValues = async (
  params: RecordNodeDependentsUpdateParams
): Promise<RecordUpdateResult> => {
  const { survey, record, node, sideEffect = false } = params

  const updateResult = new RecordUpdateResult({ record })

  // 1. get dependent node pointers

  // filter nodes to update including itself and (attributes with empty values or with default values applied)
  // therefore attributes with user defined values are excluded
  const nodePointersFilterFn = (nodePointer: NodePointer): boolean => {
    const { nodeDef } = nodePointer
    if (!NodeDefs.isAttribute(nodeDef)) return false

    const referencedNodes = NodePointers.getNodesFromNodePointers({
      record: updateResult.record,
      nodePointers: [nodePointer],
    })
    return referencedNodes.some(
      (referencedNode) =>
        shouldResetDefaultValue({ record: updateResult.record, node: referencedNode }) ||
        canApplyDefaultValue({ record: updateResult.record, node: referencedNode, nodeDef })
    )
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
  for (const nodePointer of nodePointersToUpdate) {
    await updateDefaultValuesInNodes({ ...params, nodePointer, updateResult, sideEffect })
  }
  return updateResult
}
