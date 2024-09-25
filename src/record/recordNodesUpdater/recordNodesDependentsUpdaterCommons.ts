import { SystemError } from '../../error'
import { NodeDef, NodeDefExpression, NodeDefProps, NodeDefType } from '../../nodeDef'
import { Survey, SurveyDependencyType } from '../../survey'

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
