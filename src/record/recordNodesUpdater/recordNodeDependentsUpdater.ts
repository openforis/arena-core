import { SystemError } from '../../error'
import { NodeDef, NodeDefProps, NodeDefType } from '../../nodeDef'
import { Record } from '../record'
import { Survey, Surveys } from '../../survey'
import { Node, Nodes } from '../../node'
import { Objects } from '../../utils'
import { SurveyDependencyType } from '../../survey/survey'
import { NodePointer } from './nodePointer'
import { RecordUpdateResult } from './recordUpdateResult'
import { Records } from '../records'

const _logError = (params: {
  error: any
  expressionType: SurveyDependencyType
  survey: Survey
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
  expressionsToEvaluate: Array<string>
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
  const nodePointersToUpdate = RecordReader.getDependentNodePointers({
    survey,
    record,
    node,
    dependencyType: SurveyDependencyType.applicable,
  })

  const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: node.nodeDefUuid })

  if (Node.isCreated(node) && !Objects.isEmpty(nodeDef.propsAdvanced?.applicable)) {
    // Include a pointer to node itself if it has just been created and it has an "applicable if" expression
    nodePointersToUpdate.push({
      nodeDef,
      nodeCtx: Records.getParent({ record, node }),
    })
  }

  // 2. update expr to node and dependent nodes
  // NOTE: don't do it in parallel, same nodeCtx metadata could be overwritten
  nodePointersToUpdate.forEach((nodePointer: NodePointer) => {
    const { nodeCtx: nodeCtxNodePointer, nodeDef: nodeDefNodePointer } = nodePointer
    const nodeCtxUuid = nodeCtxNodePointer.uuid
    // nodeCtx could have been updated in a previous iteration
    const nodeCtx = updateResult.getNodeByUuid(nodeCtxUuid) || nodeCtxNodePointer
    const expressionsToEvaluate = nodeDefNodePointer.propsAdvanced?.applicable
    // 3. evaluate applicable expression
    const exprEval = RecordExpressionParser.evalApplicableExpression(
      survey,
      updateResult.record,
      nodeCtx,
      expressionsToEvaluate
    )

    const applicable = exprEval.value || false

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
        RecordReader.visitDescendantsAndSelf(nodeCtxChild, (nodeDescendant) => {
          updateResult.addNode(nodeDescendant)
        })(updateResult.record)
      })
    }
  })

  return updateResult
}

export const updateSelfAndDependentsDefaultValues = ({ survey, record, node, logger = null }) => {
  const updateResult = new RecordUpdateResult({ record })

  // 1. fetch dependent nodes

  // filter nodes to update including itself and (attributes with empty values or with default values applied)
  // therefore attributes with user defined values are excluded
  const nodeDependentPointersFilterFn = (nodePointer) => {
    const { nodeCtx, nodeDef } = nodePointer

    return NodeDef.isAttribute(nodeDef) && (Node.isValueBlank(nodeCtx) || Node.isDefaultValueApplied(nodeCtx))
  }

  const nodePointersToUpdate = RecordReader.getDependentNodePointers(
    survey,
    node,
    Survey.dependencyTypes.defaultValues,
    true, // IncludeSelf
    nodeDependentPointersFilterFn
  )(record)

  // 2. update expr to node and dependent nodes
  nodePointersToUpdate.forEach(({ nodeCtx, nodeDef }) => {
    const expressionsToEvaluate = NodeDef.getDefaultValues(nodeDef)

    try {
      // 3. evaluate applicable default value expression
      const exprEval = RecordExpressionParser.evalApplicableExpression(survey, record, nodeCtx, expressionsToEvaluate)

      const oldValue = Node.getValue(nodeCtx, null)

      const exprEvalValue = exprEval.value
      const exprValue = Objects.isEmpty(exprEvalValue)
        ? null
        : RecordExpressionValueConverter.toNodeValue(survey, record, nodeCtx, exprEvalValue)

      // 4
      // 4a. if node value is not changed, do nothing
      if (Objects.isEqual(oldValue, exprValue)) {
        return // do nothing
      }

      // 4b. update node value and meta and return updated node
      const defaultValueApplied = !Objects.isEmpty(exprEval)
      const nodeCtxUpdated = A.pipe(
        Node.assocIsDefaultValueApplied(defaultValueApplied),
        Node.assocValue(exprValue)
      )(nodeCtx)
      updateResult.addNode(nodeCtxUpdated)
    } catch (error) {
      _logError({
        error,
        expressionType: SurveyDependencyType.defaultValues,
        survey,
        nodeDef,
        expressionsToEvaluate,
        logger,
      })
    }
  })

  return updateResult
}
