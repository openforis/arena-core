import { User } from '../../auth'
import { Node, NodePointer, Nodes, NodeValueFile, NodeValues } from '../../node'
import { NodeDefFile, NodeDefs } from '../../nodeDef'
import { NodeDefExpressionFactory } from '../../nodeDef/nodeDef'
import { Survey, Surveys } from '../../survey'
import { SurveyDependencyType } from '../../survey/survey'
import { Dates, FileNames, Objects } from '../../utils'
import { NodePointers } from '../nodePointers'
import { Record } from '../record'
import { RecordExpressionEvaluator } from '../recordExpressionEvaluator'
import { Records } from '../records'
import { RecordNodeDependentsUpdateParams } from './recordNodeDependentsUpdateParams'
import { throwError } from './recordNodesDependentsUpdaterCommons'
import { RecordUpdateResult } from './recordUpdateResult'

const expressionEvaluator = new RecordExpressionEvaluator()

const fileNameWithPositionSuffixRegExp = /^.+\s\[\d+\]$/ // file name like "name [1].test"

const addPositionSuffix = (params: { fileName: string; position: number }) => {
  const { fileName, position } = params
  return `${fileName} [${position}]`
}

const calculateFileName = async (params: {
  user: User
  survey: Survey
  record: Record
  node: Node
}): Promise<string | undefined> => {
  const { user, survey, record, node } = params

  const nodeDef: NodeDefFile = Surveys.getNodeDefByUuid({ survey, uuid: node.nodeDefUuid }) as NodeDefFile
  const fileNameExpression = NodeDefs.getFileNameExpression(nodeDef)
  if (!fileNameExpression) return undefined

  const { value } = node

  let fileNameCalculated = await expressionEvaluator.evalExpression({
    user,
    survey,
    record,
    node,
    query: fileNameExpression,
  })
  if (!fileNameCalculated) return undefined

  fileNameCalculated = String(fileNameCalculated)
  if (NodeDefs.isMultiple(nodeDef) && !fileNameWithPositionSuffixRegExp.test(fileNameCalculated)) {
    const index = Records.getNodeIndex({ record, node })
    fileNameCalculated = addPositionSuffix({ fileName: fileNameCalculated, position: index + 1 })
  }

  // add extension from original file name
  const originalFilaName = value ? (value as NodeValueFile).fileName : undefined
  if (Objects.isNotEmpty(originalFilaName)) {
    const originalExtension = FileNames.getExtension(originalFilaName)
    fileNameCalculated = FileNames.addExtensionIfMissing(fileNameCalculated, originalExtension)
  }
  return fileNameCalculated
}

const updateFileNamesInNodes = async (params: {
  user: User
  survey: Survey
  nodePointer: NodePointer
  updateResult: RecordUpdateResult
  sideEffect?: boolean
}): Promise<void> => {
  const { user, survey, nodePointer, updateResult, sideEffect = false } = params

  const { nodeCtx, nodeDef } = nodePointer

  if (nodeCtx.deleted) return

  const expressionToEvaluate = NodeDefs.getFileNameExpression(nodeDef as NodeDefFile)
  if (!expressionToEvaluate) return

  const { record } = updateResult

  const nodes = NodePointers.getNodesFromNodePointers({ record, nodePointers: [nodePointer] })

  for (const node of nodes) {
    if (!Nodes.isValueBlank(node)) {
      await updateFileNameInNode({ user, survey, updateResult, sideEffect, nodeDef: nodeDef as NodeDefFile, node })
    }
  }
}

export const updateSelfAndDependentsFileNames = async (
  params: RecordNodeDependentsUpdateParams
): Promise<RecordUpdateResult> => {
  const { user, survey, record, node, sideEffect = false } = params

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
  for (const nodePointer of nodePointersToUpdate) {
    await updateFileNamesInNodes({ user, survey, nodePointer, updateResult, sideEffect })
  }
  return updateResult
}

const updateFileNameInNode = async (params: {
  user: User
  survey: Survey
  updateResult: RecordUpdateResult
  sideEffect: boolean
  nodeDef: NodeDefFile
  node: Node
}): Promise<void> => {
  const { user, survey, updateResult, sideEffect, node, nodeDef } = params
  const expressionToEvaluate = NodeDefs.getFileNameExpression(nodeDef)
  try {
    const fileNameCalculated = await calculateFileName({ user, survey, record: updateResult.record, node })
    const oldFileNameCalculated = NodeValues.getFileNameCalculated(node)
    if (fileNameCalculated !== oldFileNameCalculated) {
      const nodeUpdated = Nodes.mergeNodes(node, {
        value: { [NodeValues.valuePropsFile.fileNameCalculated]: fileNameCalculated },
        updated: true,
        dateModified: Dates.nowFormattedForStorage(),
      })
      updateResult.addNode(nodeUpdated, { sideEffect })
    }
  } catch (error) {
    const expressionsToEvaluate = [NodeDefExpressionFactory.createInstance({ expression: expressionToEvaluate! })]
    throwError({
      error,
      errorKey: 'record.updateSelfAndDependentsFileNames',
      expressionType: SurveyDependencyType.fileName,
      survey,
      nodeDef,
      expressionsToEvaluate,
    })
  }
}
