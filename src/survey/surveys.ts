import { Arrays } from '../utils'
import { NodeDef, NodeDefProps, NodeDefType } from '../nodeDef'
import { Survey } from './survey'
import { CategoryItem } from '../category'

const getNodeDefByName = (params: { survey: Survey; name: string }): NodeDef<NodeDefType, NodeDefProps> => {
  const { survey, name } = params
  const nodeDef = Object.values(survey.nodeDefs || {}).find((nodeDef) => nodeDef.props.name === name)
  if (!nodeDef) throw new Error(`Node def with name ${name} not found in survey`)
  return nodeDef
}

const getNodeDefByUuid = (params: { survey: Survey; uuid: string }): NodeDef<NodeDefType, NodeDefProps> => {
  const { survey, uuid } = params
  const nodeDef = survey.nodeDefs?.[uuid]
  if (!nodeDef) throw new Error(`Node def with uuid ${uuid} not found in survey`)
  return nodeDef
}

const getNodeDefParent = (params: {
  survey: Survey
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
}): NodeDef<NodeDefType, NodeDefProps> => {
  const { survey, nodeDef } = params
  if (!nodeDef.parentUuid) throw new Error('Cannot get parent def from root def')
  return getNodeDefByUuid({ survey, uuid: nodeDef.parentUuid })
}

const isNodeDefAncestor = (params: {
  nodeDefAncestor: NodeDef<NodeDefType, NodeDefProps>
  nodeDefDescendant: NodeDef<NodeDefType, NodeDefProps>
}): boolean => {
  const { nodeDefAncestor, nodeDefDescendant } = params

  return Arrays.startsWith(nodeDefDescendant.meta.h, [...nodeDefAncestor.meta.h, nodeDefAncestor.uuid])
}

const getCategoryItemByCodePaths = (params: {
  survey: Survey
  categoryUuid: string
  codePaths: string[]
}): CategoryItem | undefined => {
  const { survey, categoryUuid, codePaths } = params
  const itemUuid = codePaths.reduce((currentParentUuid: string | undefined, code) => {
    if (currentParentUuid) {
      return survey.refData?.categoryItemUuidIndex?.[categoryUuid]?.[currentParentUuid]?.[code]
    }
    return undefined
  }, 'null')
  return itemUuid ? survey.refData?.categoryItemIndex[itemUuid] : undefined
}

export const Surveys = {
  getNodeDefByName,
  getNodeDefByUuid,
  getNodeDefParent,
  isNodeDefAncestor,
  getCategoryItemByCodePaths,
}
