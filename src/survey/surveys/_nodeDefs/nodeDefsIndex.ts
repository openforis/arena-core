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

    let surveyUpdated: Survey = Objects.assocPath({
      obj: survey,
      path: [keys.nodeDefsIndex, keys.nodeDefUuidByName, name],
      value: nodeDef.uuid,
      sideEffect,
    })

    if (parentUuid) {
      surveyUpdated = Objects.assocPath({
        obj: surveyUpdated,
        path: [keys.nodeDefsIndex, keys.childDefUuidPresenceByParentUuid, parentUuid, uuid],
        value: true,
        sideEffect,
      }) as Survey
    } else if (!temporary && !analysis) {
      // nodeDef is root
      surveyUpdated = Objects.assocPath({
        obj: surveyUpdated,
        path: [keys.nodeDefsIndex, keys.rootDefUuid],
        value: uuid,
        sideEffect,
      }) as Survey
    }
    return surveyUpdated
  }

export const updateNodeDefUuidByNameIndex =
  (nodeDef: NodeDef<any>, nodeDefPrevious?: NodeDef<any>, options?: { sideEffect?: boolean }) =>
  (survey: Survey): Survey => {
    const { sideEffect } = options ?? {}
    let surveyUpdated = survey
    const currentName = NodeDefs.getName(nodeDef)
    const previousName = nodeDefPrevious ? NodeDefs.getName(nodeDefPrevious) : ''
    if (currentName !== previousName) {
      surveyUpdated = Objects.dissocPath({
        obj: surveyUpdated,
        path: [keys.nodeDefsIndex, keys.nodeDefUuidByName, previousName],
        sideEffect,
      })
      surveyUpdated = Objects.assocPath({
        obj: surveyUpdated,
        path: [keys.nodeDefsIndex, keys.nodeDefUuidByName, currentName],
        value: nodeDef.uuid,
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
