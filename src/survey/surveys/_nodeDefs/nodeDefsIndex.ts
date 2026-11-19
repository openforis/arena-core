import { ArenaNodeDef, NodeDefs } from '../../../nodeDef'
import { Objects } from '../../../utils'
import { ArenaMutationOptions } from '../../../utils/mutationOptions'
import { ArenaSurvey, ArenaSurveyNodeDefsIndex } from '../../survey'
import { getNodeDefsArray } from './nodeDefsReader'

const keys = {
  nodeDefsIndex: 'nodeDefsIndex',
}

// keys and values must match: forces every property of SurveyNodeDefsIndex to be present here,
// and a rename/typo on either side becomes a compile error instead of a silent runtime mismatch.
const indexKeys: { [K in keyof ArenaSurveyNodeDefsIndex]-?: K } = {
  childDefUuidPresenceByParentUuid: 'childDefUuidPresenceByParentUuid',
  nodeDefUuidByName: 'nodeDefUuidByName',
  qualifierPresenceByUuid: 'qualifierPresenceByUuid',
  rootDefUuid: 'rootDefUuid',
}

// ==== UPDATE

export const addNodeDefToIndex =
  (nodeDef: ArenaNodeDef<any>, options: ArenaMutationOptions = {}) =>
  (survey: ArenaSurvey): ArenaSurvey => {
    const { sideEffect = false } = options

    const { analysis, parentUuid, temporary, uuid } = nodeDef
    const name = NodeDefs.getName(nodeDef)

    let surveyUpdated: ArenaSurvey = Objects.assocPath({
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
      })
    } else if (!temporary && !analysis) {
      // nodeDef is root
      surveyUpdated = Objects.assocPath({
        obj: surveyUpdated,
        path: [keys.nodeDefsIndex, indexKeys.rootDefUuid],
        value: uuid,
        sideEffect,
      })
    }

    if (NodeDefs.isQualifier(nodeDef)) {
      surveyUpdated = Objects.assocPath({
        obj: surveyUpdated,
        path: [keys.nodeDefsIndex, indexKeys.qualifierPresenceByUuid, uuid],
        value: true,
        sideEffect,
      })
    }
    return surveyUpdated
  }

export const updateNodeDefUuidByNameIndex =
  (nodeDef: ArenaNodeDef<any>, nodeDefPrevious?: ArenaNodeDef<any>, options?: ArenaMutationOptions) =>
  (survey: ArenaSurvey): ArenaSurvey => {
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
  (nodeDef: ArenaNodeDef<any>) =>
  (survey: ArenaSurvey): ArenaSurvey => {
    const { parentUuid, uuid } = nodeDef
    const name = NodeDefs.getName(nodeDef)

    let surveyUpdated: ArenaSurvey = Objects.dissocPath({
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
    } else if (survey.nodeDefsIndex?.rootDefUuid === uuid) {
      // node def is root (other node defs without parent, e.g. temporary or analysis ones, are not)
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

/**
 * Builds the node defs index of the survey.
 *
 * @param survey - The survey.
 * @returns A copy of the survey with the node defs index (the survey passed in is not modified).
 */
export const buildAndAssocNodeDefsIndex = (survey: ArenaSurvey): ArenaSurvey => {
  // the new index is built in place: it belongs only to the copy of the survey
  const surveyUpdated: ArenaSurvey = {
    ...survey,
    nodeDefsIndex: {
      childDefUuidPresenceByParentUuid: {},
      qualifierPresenceByUuid: {},
    },
  }
  getNodeDefsArray(survey)
    .sort((nodeDef1: ArenaNodeDef<any>, nodeDef2: ArenaNodeDef<any>) => (nodeDef1.id ?? 0) - (nodeDef2.id ?? 0))
    .forEach((nodeDef) => addNodeDefToIndex(nodeDef, { sideEffect: true })(surveyUpdated))

  return surveyUpdated
}
