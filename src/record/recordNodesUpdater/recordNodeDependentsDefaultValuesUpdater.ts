import { NodeDef, NodeDefs } from '../../nodeDef'
import { Record } from '../record'
import { Survey } from '../../survey'
import { Node, NodePointer, Nodes } from '../../node'
import { Dates, Objects } from '../../utils'
import { SurveyDependencyType } from '../../survey/survey'
import { RecordUpdateResult } from './recordUpdateResult'
import { Records } from '../records'
import { RecordExpressionValueConverter } from './recordExpressionValueConverter'
import { RecordExpressionEvaluator } from '../recordExpressionEvaluator'
import { NodePointers } from '../nodePointers'
import { throwError } from './recordNodesDependentsUpdaterCommons'
import { User } from '../../auth'

const recordExpressionEvaluator = new RecordExpressionEvaluator()

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

const updateDefaultValuesInNodes = (params: {
  user: User
  survey: Survey
  nodePointer: NodePointer
  updateResult: RecordUpdateResult
  timezoneOffset?: number
  sideEffect?: boolean
}) => {
  const { user, survey, nodePointer, updateResult, timezoneOffset, sideEffect = false } = params

  const { nodeCtx, nodeDef } = nodePointer

  if (nodeCtx.deleted) return

  const expressionsToEvaluate = NodeDefs.getDefaultValues(nodeDef)
  if (expressionsToEvaluate.length === 0) return

  const { record } = updateResult

  try {
    // 1. evaluate applicable default value expression
    const exprEval = recordExpressionEvaluator.evalApplicableExpression({
      user,
      survey,
      record,
      nodeCtx,
      expressions: expressionsToEvaluate,
      timezoneOffset,
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
          timezoneOffset,
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

export const updateSelfAndDependentsDefaultValues = (params: {
  user: User
  survey: Survey
  record: Record
  node: Node
  timezoneOffset?: number
  sideEffect?: boolean
}) => {
  const { user, survey, record, node, timezoneOffset, sideEffect = false } = params

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
  nodePointersToUpdate.forEach((nodePointer) => {
    updateDefaultValuesInNodes({ user, survey, nodePointer, updateResult, timezoneOffset, sideEffect })
  })

  return updateResult
}
