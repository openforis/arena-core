import { describe, expect, test } from '@jest/globals'
import { Record } from '../record'
import { RecordUpdateResult } from './recordUpdateResult'

const createRecordStub = (uuid: string): Record => ({
  uuid,
  ownerName: 'owner',
  ownerUuid: 'owner-uuid',
  step: 'entry',
  nodes: {},
})

describe('RecordUpdateResult', () => {
  test('Merge unions cleared node definition UUID sets', () => {
    const record = createRecordStub('record-1')

    const updateResult1 = new RecordUpdateResult({
      record,
      clearedNotApplicableDefUuids: new Set(['node-def-1', 'node-def-2', 'node-def-code-1']),
    })
    const updateResult2 = new RecordUpdateResult({
      record,
      clearedNotApplicableDefUuids: new Set(['node-def-2', 'node-def-3', 'node-def-code-1', 'node-def-code-2']),
    })

    updateResult1.merge(updateResult2)

    expect(updateResult1.clearedNotApplicableDefUuids).toEqual(
      new Set(['node-def-1', 'node-def-2', 'node-def-3', 'node-def-code-1', 'node-def-code-2'])
    )
  })
})
