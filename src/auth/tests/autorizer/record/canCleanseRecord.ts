import { AuthGroupName } from '../../../authGroup'
import { Authorizer } from '../../../authorizer'

import { Query } from '../user/common'

export const canCleanseRecordQueries: Query[] = [
  // truthy
  ...[
    AuthGroupName.systemAdmin,
    AuthGroupName.surveyAdmin,
    AuthGroupName.surveyEditor,
    AuthGroupName.dataAnalyst,
    AuthGroupName.dataCleanser,
  ].map((groupName) => ({
    title: `canCleanseRecords: ${groupName} can`,
    groups: [groupName],
    authorizer: Authorizer.canCleanseRecords,
    result: true,
  })),
  // falsy
  {
    title: `canCleanseRecords: ${AuthGroupName.dataEditor} cannot`,
    groups: [AuthGroupName.dataEditor],
    authorizer: Authorizer.canCleanseRecords,
    result: false,
  },
]
