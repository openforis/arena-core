import { SurveysNodeDefs } from './nodeDefs'
import { SurveysRefsData } from './refsData'

const { getNodeDefByName, getNodeDefByUuid, getNodeDefParent, isNodeDefAncestor } = SurveysNodeDefs
const { getCategoryItemByCodePaths } = SurveysRefsData

export const Surveys = {
  getNodeDefByName,
  getNodeDefByUuid,
  getNodeDefParent,
  isNodeDefAncestor,
  getCategoryItemByCodePaths,
}
