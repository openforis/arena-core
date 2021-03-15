import { AuthGroupName } from '../../../authGroup'
import { Authorizer } from '../../../authorizer'

import { Query } from '../user/common'

export const canAnalyzeRecordQueries: Query[] = [
  // truthy
  ...[AuthGroupName.systemAdmin, AuthGroupName.surveyAdmin, AuthGroupName.surveyEditor, AuthGroupName.dataAnalyst].map(
    (groupName) => ({
      title: `canAnalyzeRecords: ${groupName} can`,
      groups: [groupName],
      authorizer: Authorizer.canAnalyzeRecords,
      result: true,
    })
  ),
  // falsy
  ...[AuthGroupName.dataCleanser, AuthGroupName.dataEditor].map((groupName) => ({
    title: `canAnalyzeRecords: ${groupName} cannot`,
    groups: [groupName],
    authorizer: Authorizer.canAnalyzeRecords,
    result: false,
  })),
]
