import { describe, expect, test } from '@jest/globals'

import { Record, RecordFactory } from '../../../record'
import { Survey, SurveyFactory, SurveySecurityProp } from '../../../survey'
import { AuthGroup, AuthGroupName, SYSTEM_ADMIN_GROUP } from '../../authGroup'
import { AuthGroups } from '../../authGroups'
import { Authorizer } from '../../authorizer'
import { UserFactory } from '../../factory'
import { User } from '../../user'

// Explicit permission matrix: every auth group (alone) against the Authorizer checks.
// Expected values are written by hand on purpose (not derived from DEFAULT_AUTH_GROUPS / permissionsByGroupName):
// a change in the default groups must show up as a failing test.

const G = AuthGroupName
const allGroupNames = Object.values(AuthGroupName)

const owner = UserFactory.createInstance({ email: 'owner@arena.org', name: 'survey owner' })
const otherUser = UserFactory.createInstance({ email: 'other@arena.org', name: 'other user' })
const survey: Survey = SurveyFactory.createInstance({ name: 'test_authorizer_matrix', ownerUuid: owner.uuid })
survey.authGroups = AuthGroups.getDefaultAuthGroups(survey.uuid)

const createUser = (groupName: AuthGroupName): User => {
  let authGroups: AuthGroup[]
  if (groupName === G.systemAdmin) {
    authGroups = [SYSTEM_ADMIN_GROUP]
  } else if (groupName === G.surveyManager) {
    // survey managers have no default group in the survey
    authGroups = [{ name: G.surveyManager }]
  } else {
    authGroups = survey.authGroups.filter((group) => group.name === groupName)
  }
  const user = UserFactory.createInstance({ email: `${groupName}@arena.org`, name: groupName })
  return { ...user, authGroups }
}

const createRecord = (params: { user: User; step: string }): Record =>
  RecordFactory.createInstance({ user: params.user, surveyUuid: survey.uuid, step: params.step })

/**
 * Builds test cases from a list of the groups expected to be authorized: all the other groups are expected not to be.
 */
const casesWithAuthorizedGroups = (authorizedGroups: AuthGroupName[]): [AuthGroupName, boolean][] =>
  allGroupNames.map((groupName) => [groupName, authorizedGroups.includes(groupName)])

const surveyChecks: { name: string; check: (user: User, survey: Survey) => boolean; authorized: AuthGroupName[] }[] = [
  {
    name: 'canViewSurvey',
    check: Authorizer.canViewSurvey,
    authorized: [
      G.systemAdmin,
      G.surveyAdmin,
      G.surveyEditor,
      G.dataAnalyst,
      G.dataCleanser,
      G.dataEditor,
      G.surveyGuest,
    ],
  },
  {
    name: 'canEditSurvey',
    check: Authorizer.canEditSurvey,
    authorized: [G.systemAdmin, G.surveyAdmin, G.surveyEditor],
  },
  {
    name: 'canCreateRecord',
    check: Authorizer.canCreateRecord,
    authorized: [G.systemAdmin, G.surveyAdmin, G.surveyEditor, G.dataAnalyst, G.dataCleanser, G.dataEditor],
  },
  {
    name: 'canViewRecord',
    check: Authorizer.canViewRecord,
    authorized: [
      G.systemAdmin,
      G.surveyAdmin,
      G.surveyEditor,
      G.dataAnalyst,
      G.dataCleanser,
      G.dataEditor,
      G.surveyGuest,
    ],
  },
  {
    name: 'canCleanseRecords',
    check: Authorizer.canCleanseRecords,
    authorized: [G.systemAdmin, G.surveyAdmin, G.surveyEditor, G.dataAnalyst, G.dataCleanser],
  },
  {
    name: 'canAnalyzeRecords',
    check: Authorizer.canAnalyzeRecords,
    authorized: [G.systemAdmin, G.surveyAdmin, G.surveyEditor, G.dataAnalyst],
  },
  {
    // data editors and data analysts: allowed by default survey security settings (see below)
    name: 'canViewNotOwnedRecords',
    check: Authorizer.canViewNotOwnedRecords,
    authorized: [G.systemAdmin, G.surveyAdmin, G.surveyEditor, G.dataAnalyst, G.dataCleanser, G.dataEditor],
  },
  { name: 'canInviteUsers', check: Authorizer.canInviteUsers, authorized: [G.systemAdmin, G.surveyAdmin] },
]

describe('Authorizer matrix - survey level checks', () => {
  describe.each(surveyChecks)('$name', ({ check, authorized }) => {
    test.each(casesWithAuthorizedGroups(authorized))('%s => %s', (groupName, expected) => {
      expect(check(createUser(groupName), survey)).toBe(expected)
    })
  })
})

describe('Authorizer matrix - canViewNotOwnedRecords with survey security restrictions', () => {
  const surveyRestricted: Survey = {
    ...survey,
    props: {
      ...survey.props,
      security: {
        [SurveySecurityProp.dataEditorViewNotOwnedRecordsAllowed]: false,
        [SurveySecurityProp.dataAnalystViewNotOwnedRecordsAllowed]: false,
      },
    },
  }
  test.each(casesWithAuthorizedGroups([G.systemAdmin, G.surveyAdmin, G.surveyEditor, G.dataCleanser]))(
    '%s => %s',
    (groupName, expected) => {
      expect(Authorizer.canViewNotOwnedRecords(createUser(groupName), surveyRestricted)).toBe(expected)
    }
  )
})

describe('Authorizer matrix - canCreateSurvey', () => {
  test.each(casesWithAuthorizedGroups([G.systemAdmin, G.surveyManager]))('%s => %s', (groupName, expected) => {
    expect(Authorizer.canCreateSurvey(createUser(groupName))).toBe(expected)
  })
})

// [entry, cleansing, analysis] steps
type StepsExpectation = [boolean, boolean, boolean]
const steps = ['1', '2', '3']

const editRecordExpectations: { [key in AuthGroupName]: { owned: StepsExpectation; notOwned: StepsExpectation } } = {
  // records in analysis step cannot be edited (by anyone)
  [G.systemAdmin]: { owned: [true, true, false], notOwned: [true, true, false] },
  [G.surveyManager]: { owned: [false, false, false], notOwned: [false, false, false] },
  [G.surveyAdmin]: { owned: [true, true, false], notOwned: [true, true, false] },
  [G.surveyEditor]: { owned: [true, true, false], notOwned: [true, true, false] },
  [G.dataAnalyst]: { owned: [true, true, false], notOwned: [true, true, false] },
  [G.dataCleanser]: { owned: [true, true, false], notOwned: [true, true, false] },
  // data editors can edit only their own records, only in entry step
  [G.dataEditor]: { owned: [true, false, false], notOwned: [false, false, false] },
  [G.surveyGuest]: { owned: [false, false, false], notOwned: [false, false, false] },
}

// canChangeRecordProps (and canChangeRecordStep, canChangeRecordOwner, canDemoteRecord): like canEditRecord,
// but records in analysis step are allowed
const changeRecordPropsExpectations: {
  [key in AuthGroupName]: { owned: StepsExpectation; notOwned: StepsExpectation }
} = {
  [G.systemAdmin]: { owned: [true, true, true], notOwned: [true, true, true] },
  [G.surveyManager]: { owned: [false, false, false], notOwned: [false, false, false] },
  [G.surveyAdmin]: { owned: [true, true, true], notOwned: [true, true, true] },
  [G.surveyEditor]: { owned: [true, true, true], notOwned: [true, true, true] },
  [G.dataAnalyst]: { owned: [true, true, true], notOwned: [true, true, true] },
  [G.dataCleanser]: { owned: [true, true, false], notOwned: [true, true, false] },
  [G.dataEditor]: { owned: [true, false, false], notOwned: [false, false, false] },
  // NOTE: survey guests have "all" permission on analysis step records
  [G.surveyGuest]: { owned: [false, false, true], notOwned: [false, false, true] },
}

const recordCases = (expectations: typeof editRecordExpectations) =>
  allGroupNames.flatMap((groupName) =>
    steps.flatMap((step, stepIndex) => [
      { groupName, step, owned: true, expected: expectations[groupName].owned[stepIndex] },
      { groupName, step, owned: false, expected: expectations[groupName].notOwned[stepIndex] },
    ])
  )

const runRecordCheck = (
  check: (user: User, record: Record) => boolean,
  params: { groupName: AuthGroupName; step: string; owned: boolean }
): boolean => {
  const { groupName, step, owned } = params
  const user = createUser(groupName)
  const record = createRecord({ user: owned ? user : otherUser, step })
  return check(user, record)
}

describe('Authorizer matrix - canEditRecord', () => {
  test.each(recordCases(editRecordExpectations))(
    '$groupName, step $step, owned: $owned => $expected',
    ({ expected, ...params }) => {
      expect(runRecordCheck(Authorizer.canEditRecord, params)).toBe(expected)
      // canDeleteRecord is the same as canEditRecord
      expect(runRecordCheck(Authorizer.canDeleteRecord, params)).toBe(expected)
    }
  )
})

describe('Authorizer matrix - canChangeRecordStep', () => {
  test.each(recordCases(changeRecordPropsExpectations))(
    '$groupName, step $step, owned: $owned => $expected',
    ({ expected, ...params }) => {
      expect(runRecordCheck(Authorizer.canChangeRecordStep, params)).toBe(expected)
      expect(runRecordCheck(Authorizer.canChangeRecordOwner, params)).toBe(expected)
      expect(runRecordCheck(Authorizer.canDemoteRecord, params)).toBe(expected)
    }
  )
})
