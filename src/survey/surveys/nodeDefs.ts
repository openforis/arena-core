import { Survey } from '../survey'
import { NodeDef, NodeDefProps, NodeDefType } from '../../nodeDef'
import { Arrays } from '../../utils'
import { SystemError } from '../../error'

export const getNodeDefByName = (params: { survey: Survey; name: string }): NodeDef<NodeDefType, NodeDefProps> => {
  const { survey, name } = params
  const nodeDef = Object.values(survey.nodeDefs || {}).find((nodeDef) => nodeDef.props.name === name)
  if (!nodeDef) throw new SystemError('survey.nodeDefNameNotFound', { name })
  return nodeDef
}

export const getNodeDefByUuid = (params: { survey: Survey; uuid: string }): NodeDef<NodeDefType, NodeDefProps> => {
  const { survey, uuid } = params
  const nodeDef = survey.nodeDefs?.[uuid]
  if (!nodeDef) throw new SystemError('survey.nodeDefUuidNotFound', { uuid })
  return nodeDef
}

export const getNodeDefParent = (params: {
  survey: Survey
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
}): NodeDef<NodeDefType, NodeDefProps> | undefined => {
  const { survey, nodeDef } = params
  if (!nodeDef.parentUuid) return undefined
  return getNodeDefByUuid({ survey, uuid: nodeDef.parentUuid })
}

export const isNodeDefAncestor = (params: {
  nodeDefAncestor: NodeDef<NodeDefType, NodeDefProps>
  nodeDefDescendant: NodeDef<NodeDefType, NodeDefProps>
}): boolean => {
  const { nodeDefAncestor, nodeDefDescendant } = params

  return Arrays.startsWith(nodeDefDescendant.meta.h, [...nodeDefAncestor.meta.h, nodeDefAncestor.uuid])
}

export const getNodeDefRoot = (params: { survey: Survey }): NodeDef<NodeDefType, NodeDefProps> => {
  const { survey } = params
  if (!survey.nodeDefs) throw new SystemError('survey.emptyNodeDefs')
  const rootDef = Object.values(survey.nodeDefs).find((nodeDef) => !nodeDef.parentUuid)
  if (!rootDef) throw new SystemError('survey.rootDefNotFound')
  return rootDef
}

export const getNodeDefSource = (params: {
  survey: Survey
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
}): NodeDef<NodeDefType, NodeDefProps> | undefined => {
  const { survey, nodeDef } = params
  return nodeDef.virtual ? getNodeDefParent({ survey, nodeDef }) : undefined
}

export const getNodeDefChildren = (params: {
  survey: Survey
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
  includeAnalysis?: boolean
}): NodeDef<NodeDefType, NodeDefProps>[] => {
  const { survey, nodeDef, includeAnalysis = false } = params

  if (!survey.nodeDefs) return []

  const children = []
  if (nodeDef.virtual) {
    // If nodeDef is virtual, get children from its source
    const entitySource = getNodeDefSource({ survey, nodeDef })
    if (entitySource) {
      children.push(...getNodeDefChildren({ survey, nodeDef: entitySource }))
    }
  }

  children.push(
    ...Object.values(survey.nodeDefs).filter((nodeDefCurrent) => {
      if (!includeAnalysis && nodeDefCurrent.analysis) {
        return false
      }
      if (nodeDefCurrent.virtual) {
        // Include virtual entities having their source as a child of the given entity
        const entitySource = getNodeDefSource({ survey, nodeDef: nodeDefCurrent })
        if (entitySource) {
          return entitySource.parentUuid === nodeDef.uuid
        }
      }
      // "natural" child
      return nodeDefCurrent.parentUuid === nodeDef.uuid
    })
  )
  return children
}
