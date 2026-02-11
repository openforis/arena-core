import { Node, NodePointer, Nodes } from '../../node'
import { NodeDef, NodeDefs } from '../../nodeDef'
import { Surveys } from '../../survey'
import { Survey, SurveyDependencyType } from '../../survey/survey'
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

/**
 * Default value should be reset when a node becomes not applicable, but only if the default value was applied or if the node def is read only (therefore the value can only be set by default value expression)
 */
const shouldResetDefaultValue = (params: { survey: Survey; record: Record; node: Node }): boolean => {
  const { survey, record, node } = params
  const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: node.nodeDefUuid })
  return (
    !Records.isNodeApplicable({ record, node }) &&
    !Nodes.isValueBlank(node) &&
    (Nodes.isDefaultValueApplied(node) || NodeDefs.isReadOnly(nodeDef))
  )
}

const canApplyDefaultValue = (params: { record: Record; node: Node; nodeDef: NodeDef<any> }): boolean => {
  const { record, node, nodeDef } = params
  return (
    Records.isNodeApplicable({ record, node }) &&
    (Nodes.isValueBlank(node) ||
      (!NodeDefs.isDefaultValueEvaluatedOneTime(nodeDef) &&
        (Nodes.isDefaultValueApplied(node) || NodeDefs.isReadOnly(nodeDef))))
  )
}

const updateDefaultValueInNode = (params: {
  survey: Survey
  updateResult: RecordUpdateResult
  nodeToUpdate: Node
  nodeDef: NodeDef<any>
  exprValue: any
  sideEffect: boolean
}): void => {
  const { survey, updateResult, nodeToUpdate, nodeDef, exprValue, sideEffect } = params
  if (shouldResetDefaultValue({ survey, record: updateResult.record, node: nodeToUpdate })) {
    const nodeUpdated = Nodes.mergeNodes(nodeToUpdate, {
      value: null,
      meta: { defaultValueApplied: false },
      updated: true,
      dateModified: Dates.nowFormattedForStorage(),
    })
    updateResult.addNode(nodeUpdated, { sideEffect })
    return
  }
  if (!canApplyDefaultValue({ record: updateResult.record, nodeDef, node: nodeToUpdate })) {
    return
  }

  // 2. if node value is not changed, do nothing
  if (Objects.isEqual(nodeToUpdate.value, exprValue)) {
    return
  }

  // 3. update node value and meta
  const defaultValueApplied = !Objects.isEmpty(exprValue)

  const nodeUpdated = Nodes.mergeNodes(nodeToUpdate, {
    value: exprValue,
    meta: { defaultValueApplied },
    updated: true,
    dateModified: Dates.nowFormattedForStorage(),
  })
  updateResult.addNode(nodeUpdated, { sideEffect })
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

  const { record } = updateResult

  let nodesToUpdate: Node[] = []
  const dependentNodes = NodePointers.getNodesFromNodePointers({ record, nodePointers: [nodePointer] })
  let exprValue: any = null
  const expressionsToEvaluate = NodeDefs.getDefaultValues(nodeDef)
  if (expressionsToEvaluate.length === 0) {
    if (Surveys.isNodeDefEnumerator({ survey, nodeDef })) {
      // if node def is enumerator, its default value is generated using the category items, not with default value expressions
      // so the default value should not be reset or updated using default value expressions
      return
    }
    // no default expressions to evaluate; check if there are dependent nodes with default value applied, as their default value should be removed
    nodesToUpdate = dependentNodes.filter(Nodes.isDefaultValueApplied)
    if (nodesToUpdate.length === 0) {
      // no default expressions to evaluate and no nodes with default value applied, therefore no update needed
      return
    }
  } else {
    // if there are default value expressions, all dependent nodes should be evaluated, as their default value could change
    nodesToUpdate = dependentNodes
    try {
      // 1. evaluate applicable default value expression
      const exprEval = await expressionEvaluator.evalApplicableExpression({
        ...params,
        record,
        nodeCtx,
        expressions: expressionsToEvaluate,
      })

      const exprEvalValue = exprEval?.value
      exprValue = Objects.isEmpty(exprEvalValue)
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
  for (const nodeToUpdate of nodesToUpdate) {
    updateDefaultValueInNode({ survey, updateResult, nodeToUpdate, nodeDef, exprValue, sideEffect })
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
        shouldResetDefaultValue({ survey, record: updateResult.record, node: referencedNode }) ||
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
