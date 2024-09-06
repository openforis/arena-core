import { Node, NodeValueFile } from '../../node'
import { NodeDefFile, NodeDefs } from '../../nodeDef'
import { Survey, Surveys } from '../../survey'
import { FileNames, Objects } from '../../utils'
import { Record } from '../record'
import { RecordExpressionEvaluator } from '../recordExpressionEvaluator'

export const getFileName = (params: { survey: Survey; record: Record; node: Node }): string | undefined => {
  const { survey, record, node } = params
  const nodeDef: NodeDefFile = Surveys.getNodeDefByUuid({ survey, uuid: node.nodeDefUuid }) as NodeDefFile
  const fileNameExpression = NodeDefs.getFileNameExpression(nodeDef)
  const { value } = node
  const nodeFileName = value ? (value as NodeValueFile).fileName : undefined

  if (!fileNameExpression) return nodeFileName

  let fileName = new RecordExpressionEvaluator().evalExpression({ survey, record, node, query: fileNameExpression })
  if (Objects.isEmpty(fileName)) return nodeFileName

  fileName = String(fileName)

  if (Objects.isNotEmpty(nodeFileName)) {
    const originalExtension = FileNames.getExtension(nodeFileName!)
    fileName = FileNames.addExtensionIfMissing(fileName, originalExtension)
  }
  return fileName
}
