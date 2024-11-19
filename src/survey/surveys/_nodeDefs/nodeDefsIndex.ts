import { NodeDef, NodeDefs } from '../../../nodeDef'
import { Objects } from '../../../utils'
import { Survey } from '../../survey'
import { getNodeDefsArray } from './nodeDefsReader'

const keys = {
  nodeDefsIndex: 'nodeDefsIndex',
  childDefUuidPresenceByParentUuid: 'childDefUuidPresenceByParentUuid',
  nodeDefUuidByName: 'nodeDefUuidByName',
  rootDefUuid: 'rootDefUuid',
}

// ==== READ

export const getNodeDefsIndex = (survey: Survey) => {
  const { nodeDefsIndex } = survey
  return nodeDefsIndex || {}
}

// ==== UPDATE

export const addNodeDefToIndex =
  (nodeDef: NodeDef<any>, options: { sideEffect: boolean }) =>
  (survey: Survey): Survey => {
    const { sideEffect = false } = options || {}

    const { analysis, parentUuid, temporary, uuid } = nodeDef
    const name = NodeDefs.getName(nodeDef)

    const surveyUpdated: Survey = Objects.assocPath({
      obj: survey,
      path: [keys.nodeDefsIndex, keys.nodeDefUuidByName, name],
      value: nodeDef.uuid,
      sideEffect,
    })

    if (parentUuid) {
      return Objects.assocPath({
        obj: surveyUpdated,
        path: [keys.nodeDefsIndex, keys.childDefUuidPresenceByParentUuid, parentUuid, uuid],
        value: true,
        sideEffect,
      })
    }
    if (!temporary && !analysis) {
      // nodeDef is root
      return Objects.assocPath({
        obj: surveyUpdated,
        path: [keys.nodeDefsIndex, keys.rootDefUuid],
        value: uuid,
        sideEffect,
      })
    }
    return surveyUpdated
  }

// ==== DELETE

export const deleteNodeDefIndex =
  (nodeDef: NodeDef<any>) =>
  (survey: Survey): Survey => {
    const { parentUuid, uuid } = nodeDef
    const name = NodeDefs.getName(nodeDef)

    let surveyUpdated: Survey = Objects.dissocPath({
      obj: survey,
      path: [keys.nodeDefsIndex, keys.childDefUuidPresenceByParentUuid, uuid],
    })

    surveyUpdated = Objects.dissocPath({
      obj: surveyUpdated,
      path: [keys.nodeDefsIndex, keys.nodeDefUuidByName, name],
    })

    if (parentUuid) {
      surveyUpdated = Objects.dissocPath({
        obj: surveyUpdated,
        path: [keys.nodeDefsIndex, keys.childDefUuidPresenceByParentUuid, parentUuid, uuid],
      })
    } else {
      // node def is root
      surveyUpdated = Objects.dissocPath({
        obj: surveyUpdated,
        path: [keys.nodeDefsIndex, keys.rootDefUuid],
      })
    }
    return surveyUpdated
  }

// ==== CREATE

export const buildAndAssocNodeDefsIndex = (survey: Survey): Survey => {
  survey.nodeDefsIndex = {
    childDefUuidPresenceByParentUuid: {},
  }
  getNodeDefsArray(survey)
    .sort((nodeDef1: NodeDef<any>, nodeDef2: NodeDef<any>) => (nodeDef1.id ?? 0) - (nodeDef2.id ?? 0))
    .forEach((nodeDef) => addNodeDefToIndex(nodeDef, { sideEffect: true })(survey))

  return survey
}
