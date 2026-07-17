import { NodeDef, NodeDefs } from '../../../nodeDef'
import { Objects } from '../../../utils'
import { Survey, SurveyNodeDefsIndex } from '../../survey'
import { getNodeDefsArray } from './nodeDefsReader'

const keys = {
  nodeDefsIndex: 'nodeDefsIndex',
}

// keys and values must match: forces every property of SurveyNodeDefsIndex to be present here,
// and a rename/typo on either side becomes a compile error instead of a silent runtime mismatch.
const indexKeys: { [K in keyof SurveyNodeDefsIndex]-?: K } = {
  childDefUuidPresenceByParentUuid: 'childDefUuidPresenceByParentUuid',
  nodeDefUuidByName: 'nodeDefUuidByName',
  qualifierPresenceByUuid: 'qualifierPresenceByUuid',
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
      path: [keys.nodeDefsIndex, indexKeys.nodeDefUuidByName, name],
      value: nodeDef.uuid,
      sideEffect,
    })

    if (parentUuid) {
      surveyUpdated = Objects.assocPath({
        obj: surveyUpdated,
        path: [keys.nodeDefsIndex, indexKeys.childDefUuidPresenceByParentUuid, parentUuid, uuid],
        value: true,
        sideEffect,
      }) as Survey
    } else if (!temporary && !analysis) {
      // nodeDef is root
      surveyUpdated = Objects.assocPath({
        obj: surveyUpdated,
        path: [keys.nodeDefsIndex, indexKeys.rootDefUuid],
        value: uuid,
        sideEffect,
      }) as Survey
    }

    if (NodeDefs.isQualifier(nodeDef)) {
      surveyUpdated = Objects.assocPath({
        obj: surveyUpdated,
        path: [keys.nodeDefsIndex, indexKeys.qualifierPresenceByUuid, uuid],
        value: true,
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
        path: [keys.nodeDefsIndex, indexKeys.nodeDefUuidByName, previousName],
        sideEffect,
      })
      surveyUpdated = Objects.assocPath({
        obj: surveyUpdated,
        path: [keys.nodeDefsIndex, indexKeys.nodeDefUuidByName, currentName],
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
      path: [keys.nodeDefsIndex, indexKeys.childDefUuidPresenceByParentUuid, uuid],
    })

    surveyUpdated = Objects.dissocPath({
      obj: surveyUpdated,
      path: [keys.nodeDefsIndex, indexKeys.nodeDefUuidByName, name],
    })

    if (parentUuid) {
      surveyUpdated = Objects.dissocPath({
        obj: surveyUpdated,
        path: [keys.nodeDefsIndex, indexKeys.childDefUuidPresenceByParentUuid, parentUuid, uuid],
      })
    } else {
      // node def is root
      surveyUpdated = Objects.dissocPath({
        obj: surveyUpdated,
        path: [keys.nodeDefsIndex, indexKeys.rootDefUuid],
      })
    }

    if (NodeDefs.isQualifier(nodeDef)) {
      surveyUpdated = Objects.dissocPath({
        obj: surveyUpdated,
        path: [keys.nodeDefsIndex, indexKeys.qualifierPresenceByUuid, uuid],
      })
    }
    return surveyUpdated
  }

// ==== CREATE

export const buildAndAssocNodeDefsIndex = (survey: Survey): Survey => {
  survey.nodeDefsIndex = {
    childDefUuidPresenceByParentUuid: {},
    qualifierPresenceByUuid: {},
  }
  getNodeDefsArray(survey)
    .sort((nodeDef1: NodeDef<any>, nodeDef2: NodeDef<any>) => (nodeDef1.id ?? 0) - (nodeDef2.id ?? 0))
    .forEach((nodeDef) => addNodeDefToIndex(nodeDef, { sideEffect: true })(survey))

  return survey
}
