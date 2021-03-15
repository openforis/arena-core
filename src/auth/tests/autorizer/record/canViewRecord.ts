import { AuthGroupName } from '../../../authGroup'
import { Authorizer } from '../../../authorizer'

import { Query } from '../common'

export const canViewRecordQueries: Query[] = [
  ...[
    AuthGroupName.systemAdmin,
    AuthGroupName.surveyAdmin,
    AuthGroupName.surveyEditor,
    AuthGroupName.dataAnalyst,
    AuthGroupName.dataCleanser,
    AuthGroupName.dataEditor,
  ].map((groupName) => ({
    title: `canViewRecord: ${groupName} can`,
    groups: [groupName],
    authorizer: Authorizer.canViewRecord,
    result: true,
  })),
]
