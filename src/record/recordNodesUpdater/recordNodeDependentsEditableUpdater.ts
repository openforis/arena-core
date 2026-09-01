import { Nodes } from '../../node'
import { NodeDefs } from '../../nodeDef'
import { SurveyDependencyType } from '../../survey/survey'
import { RecordNodeDependentsUpdateParams } from './recordNodeDependentsUpdateParams'
import { updateSelfAndDependentsBoolean } from './recordNodeDependentsBooleanUpdater'
import { RecordUpdateResult } from './recordUpdateResult'

export const updateSelfAndDependentsEditable = async (
  params: RecordNodeDependentsUpdateParams
): Promise<RecordUpdateResult> => {
  return updateSelfAndDependentsBoolean({
    params,
    dependencyType: SurveyDependencyType.editable,
    getExpressions: ({ nodeDef }) => NodeDefs.getEditableIf(nodeDef),
    getValuePrev: (nodeCtx, nodeDefUuid) => Nodes.isChildEditable(nodeCtx, nodeDefUuid),
    assocValue: (nodeCtx, nodeDefUuid, value, sideEffect) =>
      Nodes.assocChildEditable(nodeCtx, nodeDefUuid, value, sideEffect),
  })
}
