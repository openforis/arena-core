import { ArenaExportFile } from './ArenaExportFile'

describe('ArenaExportFile', () => {
  test('survey entries', () => {
    expect(ArenaExportFile.info).toBe('info.json')
    expect(ArenaExportFile.survey).toBe('survey.json')
    expect(ArenaExportFile.surveyFilesDir).toBe('surveyfiles')
    expect(ArenaExportFile.surveyFile({ fileUuid: 'f1' })).toBe('surveyfiles/f1.bin')
    expect(ArenaExportFile.chainMauFilesSummaries).toBe('surveyfiles/chainMauFiles.json')
  })

  test('categories and taxonomies', () => {
    expect(ArenaExportFile.categories).toBe('categories/categories.json')
    expect(ArenaExportFile.categoryItemsSingleFile({ categoryUuid: 'c1' })).toBe('categories/c1.json')
    expect(ArenaExportFile.categoryItemsPart({ categoryUuid: 'c1', index: 2 })).toBe('categories/c1_2.json')
    expect(ArenaExportFile.taxonomies).toBe('taxonomies/taxonomies.json')
    expect(ArenaExportFile.taxa({ taxonomyUuid: 't1' })).toBe('taxonomies/t1.json')
    expect(ArenaExportFile.taxaPart({ taxonomyUuid: 't1', index: 0 })).toBe('taxonomies/t1_0.json')
  })

  test('records and record files', () => {
    expect(ArenaExportFile.recordsDir).toBe('records')
    expect(ArenaExportFile.records).toBe('records/records.json')
    expect(ArenaExportFile.record({ recordUuid: 'r1' })).toBe('records/r1.json')
    expect(ArenaExportFile.filesDir).toBe('files')
    expect(ArenaExportFile.filesSummaries).toBe('files/files.json')
    expect(ArenaExportFile.file({ fileUuid: 'f1' })).toBe('files/f1.bin')
    expect(ArenaExportFile.fileOld({ fileUuid: 'f1' })).toBe('files/f1.json')
  })

  test('chains, users and activity log', () => {
    expect(ArenaExportFile.chains).toBe('chains/chains.json')
    expect(ArenaExportFile.chain({ chainUuid: 'ch1' })).toBe('chains/ch1.json')
    expect(ArenaExportFile.users).toBe('users/users.json')
    expect(ArenaExportFile.userInvitations).toBe('users/userInvitations.json')
    expect(ArenaExportFile.userProfilePicture({ userUuid: 'u1' })).toBe('users/profilepictures/u1')
    expect(ArenaExportFile.activityLog({ index: 3 })).toBe('activitylog/activityLog_3.json')
  })
})
