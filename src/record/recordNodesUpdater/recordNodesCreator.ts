import { Node, NodeFactory } from '../../node'
import { NodeDef, NodeDefs } from '../../nodeDef'
import { Survey, Surveys } from '../../survey'
import { Record } from '../record'
import { RecordUpdateResult } from './recordUpdateResult'

const getNodesToInsertCount = (nodeDef: NodeDef<any>): number => {
  if (NodeDefs.isSingle(nodeDef)) return 1
  return NodeDefs.getMinCount(nodeDef) || 0
}

const createChildNodesBasedOnMinCount =
  (params: { survey: Survey; updateResult: any; parentNode: Node }) =>
  (childDef: NodeDef<any>): void => {
    const { survey, parentNode, updateResult } = params

    const nodesToInsertCount = getNodesToInsertCount(childDef)
    if (nodesToInsertCount === 0) {
      return // do nothing
    }
    for (let index = 0; index < nodesToInsertCount; index++) {
      const childUpdateResult = createNodeAndDescendants({
        survey,
        record: updateResult.record,
        parentNode,
        nodeDef: childDef,
      })
      updateResult.merge(childUpdateResult)
    }
  }

export const createNodeAndDescendants = (params: {
  survey: Survey
  record: Record
  parentNode?: Node
  nodeDef: NodeDef<any>
}): RecordUpdateResult => {
  const { survey, record, parentNode, nodeDef } = params
  const node = NodeFactory.createInstance({
    nodeDefUuid: nodeDef.uuid,
    recordUuid: record.uuid,
    parentNode,
    surveyUuid: survey.uuid,
  })

  const updateResult = new RecordUpdateResult({ record })
  updateResult.addNode(node)

  // Add children if entity
  if (NodeDefs.isEntity(nodeDef)) {
    const childDefs = Surveys.getNodeDefChildren({ survey, nodeDef })

    // Add only child single nodes (it allows to apply default values)
    childDefs.forEach(createChildNodesBasedOnMinCount({ survey, parentNode: node, updateResult }))
  }
  return updateResult
}
