import { Node, NodeValueFile } from '../../node'
import { NodeDefFile, NodeDefs } from '../../nodeDef'
import { Survey, Surveys } from '../../survey'
import { Record } from '../record'
import { RecordExpressionEvaluator } from '../recordExpressionEvaluator'

export const getFileName = (params: { survey: Survey; record: Record; node: Node }): string | undefined => {
  const { survey, record, node } = params
  const nodeDef: NodeDefFile = Surveys.getNodeDefByUuid({ survey, uuid: node.nodeDefUuid }) as NodeDefFile
  const fileNameExpression = NodeDefs.getFileNameExpression(nodeDef)
  if (fileNameExpression) {
    const result = new RecordExpressionEvaluator().evalExpression({ survey, record, node, query: fileNameExpression })
    return result ? String(result) : undefined
  } else {
    const { value } = node.value
    return value ? (value as NodeValueFile).fileName : undefined
  }
}
