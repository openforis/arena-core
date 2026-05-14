import { SystemError } from '../../error'
import { Node, NodePointer } from '../../node'
import { NodeDefs } from '../../nodeDef'
import { NodeDef, NodeDefExpression, NodeDefProps, NodeDefType } from '../../nodeDef'
import { Surveys } from '../../survey'
import { Survey, SurveyDependencyType } from '../../survey'
import { Record } from '../record'
import { Records } from '../records'

export const throwError = (params: {
  error: any
  errorKey: string
  expressionType: SurveyDependencyType
  survey: Survey
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
  expressionsToEvaluate: NodeDefExpression[]
}) => {
  const { error, errorKey, expressionType, survey, nodeDef, expressionsToEvaluate } = params
  const nodeDefName = nodeDef.props.name
  const expressionsString = JSON.stringify(expressionsToEvaluate)

  throw new SystemError(errorKey, {
    surveyName: survey.props.name,
    nodeDefName,
    expressionType,
    expressionsString,
    error: error.toString(),
    errorJson: error instanceof SystemError ? error.toJSON() : null,
  })
}

export const getDependentNodePointersByType = (params: {
  survey: Survey
  record: Record
  node: Node
  dependencyType: SurveyDependencyType
  includeSelfWhenSourceIsAttribute?: boolean
  includeNewEntitySelf?: boolean
  includeNewEntityChildPointers?: boolean
  filterFn?: (nodePointer: NodePointer) => boolean
}): NodePointer[] => {
  const {
    survey,
    record,
    node,
    dependencyType,
    includeSelfWhenSourceIsAttribute = false,
    includeNewEntitySelf = false,
    includeNewEntityChildPointers = false,
    filterFn,
  } = params

  const sourceNodeDef = Surveys.getNodeDefByUuid({ survey, uuid: node.nodeDefUuid })
  const includeSelf = includeSelfWhenSourceIsAttribute && !NodeDefs.isEntity(sourceNodeDef)

  const nodePointers = Records.getDependentNodePointers({
    survey,
    record,
    node,
    dependencyType,
    includeSelf,
    filterFn,
  })

  if (NodeDefs.isEntity(sourceNodeDef) && node.created) {
    // For newly created entities, include a self-pointer so their own expression gets evaluated
    if (includeNewEntitySelf && node.parentUuid) {
      const parentNode = Records.getNodeByUuid(node.parentUuid)(record)
      if (parentNode) {
        nodePointers.push({ nodeCtx: parentNode, nodeDef: sourceNodeDef })
      }
    }
    if (includeNewEntityChildPointers) {
      // for new entities, include children multiple nodes (to update their applicability too, in case they are empty)
      const multipleNodeDefs = Surveys.getNodeDefChildren({ survey, nodeDef: sourceNodeDef }).filter(
        NodeDefs.isMultiple
      )
      for (const childDef of multipleNodeDefs) {
        nodePointers.push({ nodeCtx: node, nodeDef: childDef })
      }
    }
  }
  return nodePointers
}
