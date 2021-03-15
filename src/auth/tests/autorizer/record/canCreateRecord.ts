import { AuthGroupName } from '../../../authGroup'
import { Authorizer } from '../../../authorizer'

import { Query } from '../common'

export const canCreateRecordQueries: Query[] = [
  ...[
    AuthGroupName.systemAdmin,
    AuthGroupName.surveyAdmin,
    AuthGroupName.surveyEditor,
    AuthGroupName.dataAnalyst,
    AuthGroupName.dataCleanser,
    AuthGroupName.dataEditor,
  ].map((groupName) => ({
    title: `canCreateRecord: ${groupName} can`,
    groups: [groupName],
    authorizer: Authorizer.canCreateRecord,
    result: true,
  })),
]
