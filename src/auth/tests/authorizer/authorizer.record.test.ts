import { testQueries } from './common'
import { canAnalyzeRecordQueries } from './record/canAnalyzeRecord'
import { canCleanseRecordQueries } from './record/canCleanseRecord'
import { canCreateRecordQueries } from './record/canCreateRecord'
import { canEditRecordQueries } from './record/canEditRecord'
import { canViewRecordQueries } from './record/canViewRecord'

describe(
  'Authorizer - Record',
  testQueries([
    // CREATE
    ...canCreateRecordQueries,
    // VIEW
    ...canViewRecordQueries,
    // UPDATE
    ...canEditRecordQueries,
    ...canCleanseRecordQueries,
    ...canAnalyzeRecordQueries,
  ])
)
