import { Node, NodePointer, Nodes, NodeValues } from '../../node'
import { NodeDefFile, NodeDefs } from '../../nodeDef'
import { NodeDefExpressionFactory } from '../../nodeDef/nodeDef'
import { Survey } from '../../survey'
import { SurveyDependencyType } from '../../survey/survey'
import { Dates } from '../../utils'
import { NodePointers } from '../nodePointers'
import { Record } from '../record'
import { RecordExpressionEvaluator } from '../recordExpressionEvaluator'
import { Records } from '../records'
import { throwError } from './recordNodesDependentsUpdaterCommons'
import { RecordUpdateResult } from './recordUpdateResult'

const recordExpressionEvaluator = new RecordExpressionEvaluator()

const updateFileNamesInNodes = (params: {
  survey: Survey
  nodePointer: NodePointer
  updateResult: RecordUpdateResult
  sideEffect?: boolean
}) => {
  const { survey, nodePointer, updateResult, sideEffect = false } = params

  const { nodeCtx, nodeDef } = nodePointer

  if (nodeCtx.deleted) return

  const expressionToEvaluate = NodeDefs.getFileNameExpression(nodeDef as NodeDefFile)
  if (!expressionToEvaluate) return

  const { record } = updateResult

  const nodes = NodePointers.getNodesFromNodePointers({ record, nodePointers: [nodePointer] })

  nodes.forEach((node) => {
    try {
      // 1. evaluate file name expression
      const fileNameCalculated = Records.getFileName({
        survey,
        record: updateResult.record,
        node,
        defaultToOriginalFileName: false,
        recordExpressionEvaluator,
      })

      const nodeUpdated = Nodes.mergeNodes(node, {
        value: { [NodeValues.valuePropsFile.fileNameCalculated]: fileNameCalculated },
        updated: true,
        dateModified: Dates.nowFormattedForStorage(),
      })
      updateResult.addNode(nodeUpdated, { sideEffect })
    } catch (error) {
      const expressionsToEvaluate = [NodeDefExpressionFactory.createInstance({ expression: expressionToEvaluate })]
      throwError({
        error,
        errorKey: 'record.updateSelfAndDependentsFileNames',
        expressionType: SurveyDependencyType.fileName,
        survey,
        nodeDef,
        expressionsToEvaluate,
      })
    }
  })
}

export const updateSelfAndDependentsFileNames = (params: {
  survey: Survey
  record: Record
  node: Node
  sideEffect?: boolean
}) => {
  const { survey, record, node, sideEffect = false } = params

  const updateResult = new RecordUpdateResult({ record })

  // 1. get dependent node pointers

  const nodePointersToUpdate = Records.getDependentNodePointers({
    survey,
    record,
    node,
    dependencyType: SurveyDependencyType.fileName,
    includeSelf: true,
  })

  // 2. update expr to node and dependent nodes
  nodePointersToUpdate.forEach((nodePointer) => {
    updateFileNamesInNodes({ survey, nodePointer, updateResult, sideEffect })
  })

  return updateResult
}
