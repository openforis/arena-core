import { NodeDef } from '../../../nodeDef'
import { Objects } from '../../../utils'
import { Survey } from '../../survey'
import { getNodeDefsArray } from './nodeDefsReader'

const keys = {
  nodeDefsIndex: 'nodeDefsIndex',
  childDefUuidPresenceByParentUuid: 'childDefUuidPresenceByParentUuid',
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

    return nodeDef.parentUuid
      ? Objects.assocPath({
          obj: survey,
          path: [keys.nodeDefsIndex, keys.childDefUuidPresenceByParentUuid, nodeDef.parentUuid, nodeDef.uuid],
          value: true,
          sideEffect,
        })
      : // nodeDef is root
        Objects.assocPath({
          obj: survey,
          path: [keys.nodeDefsIndex, keys.rootDefUuid],
          value: nodeDef.uuid,
          sideEffect,
        })
  }

// ==== DELETE

export const deleteNodeDefIndex =
  (nodeDef: NodeDef<any>) =>
  (survey: Survey): Survey => {
    let surveyUpdated: Survey = Objects.dissocPath({
      obj: survey,
      path: [keys.nodeDefsIndex, keys.childDefUuidPresenceByParentUuid, nodeDef.uuid],
    }) as Survey

    const parentUuid = nodeDef.parentUuid
    if (parentUuid) {
      surveyUpdated = Objects.dissocPath({
        obj: surveyUpdated,
        path: [keys.nodeDefsIndex, keys.childDefUuidPresenceByParentUuid, parentUuid, nodeDef.uuid],
      }) as Survey
    } else {
      // node def is root
      surveyUpdated = Objects.dissocPath({
        obj: surveyUpdated,
        path: [keys.nodeDefsIndex, keys.rootDefUuid],
      }) as Survey
    }
    return surveyUpdated
  }

// ==== CREATE

export const buildAndAssocNodeDefsIndex = (survey: Survey): Survey => {
  survey.nodeDefsIndex = {
    childDefUuidPresenceByParentUuid: {},
  }
  getNodeDefsArray(survey)
    .sort((nodeDef1: NodeDef<any>, nodeDef2: NodeDef<any>) => (nodeDef1.id || 0) - (nodeDef2.id || 0))
    .forEach((nodeDef) => addNodeDefToIndex(nodeDef, { sideEffect: true })(survey))

  return survey
}
