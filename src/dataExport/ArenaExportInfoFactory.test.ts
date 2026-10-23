import { ArenaExportType } from './ArenaExportInfo'
import { ArenaExportInfoFactory } from './ArenaExportInfoFactory'

describe('ArenaExportInfoFactory', () => {
  test('creates the info with the export type and the export date', () => {
    const info = ArenaExportInfoFactory.createInstance({
      appInfo: { appId: 'arena', version: '2.10.4' },
      exportedByUserUuid: 'user-uuid',
      exportType: ArenaExportType.records,
      survey: { uuid: 'survey-uuid', name: 'survey_name' },
      options: { includeData: true },
    })
    expect(info.exportType).toBe(ArenaExportType.records)
    expect(info.survey.name).toBe('survey_name')
    expect(Number.isNaN(Date.parse(info.dateExported))).toBe(false)
  })
})
