import { canAnalyzeRecordQueries } from './record/canAnalyzeRecord'
import { canCleanseRecordQueries } from './record/canCleanseRecord'
import { canCreateRecordQueries } from './record/canCreateRecord'
import { canEditRecordQueries } from './record/canEditRecord'
import { canViewRecordQueries } from './record/canViewRecord'
import { Query, testQueries } from './common'

/* 
Contains tests for Authorizer:
For permissions, check: src/auth/authGroup.ts

  Record
  CREATE
  - canCreateRecord

  READ
  - canViewRecord

  UPDATE
  - canEditRecord
  - canCleanseRecords
  - canAnalyzeRecords

*/

const queries: Query[] = [
  ...canCreateRecordQueries,
  ...canEditRecordQueries,
  ...canCleanseRecordQueries,
  ...canViewRecordQueries,
  ...canAnalyzeRecordQueries,
]

describe('Authorizer - Record', testQueries(queries))
