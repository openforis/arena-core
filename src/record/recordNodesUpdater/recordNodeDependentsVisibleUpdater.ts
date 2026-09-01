import { Nodes } from '../../node'
import { NodeDefs } from '../../nodeDef'
import { SurveyDependencyType } from '../../survey/survey'
import { RecordNodeDependentsUpdateParams } from './recordNodeDependentsUpdateParams'
import { updateSelfAndDependentsBoolean } from './recordNodeDependentsBooleanUpdater'
import { RecordUpdateResult } from './recordUpdateResult'

export const updateSelfAndDependentsVisible = async (
  params: RecordNodeDependentsUpdateParams
): Promise<RecordUpdateResult> => {
  return updateSelfAndDependentsBoolean({
    params,
    dependencyType: SurveyDependencyType.visible,
    getExpressions: ({ nodeDef }) => NodeDefs.getVisibleIf(nodeDef),
    getValuePrev: (nodeCtx, nodeDefUuid) => Nodes.isChildVisible(nodeCtx, nodeDefUuid),
    assocValue: (nodeCtx, nodeDefUuid, value, sideEffect) =>
      Nodes.assocChildVisible(nodeCtx, nodeDefUuid, value, sideEffect),
  })
}
