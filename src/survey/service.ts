import { ArenaUser } from '../auth'
import { ArenaService } from '../common'
import { ArenaJobSerialized } from '../job'
import { LanguageCode } from '../language'
import { ArenaSurvey, ArenaSurveyProps } from './survey'

export interface ArenaSurveyService extends ArenaService {
  // ==== CREATE
  create(options: { name: string; label: string; lang: LanguageCode; user: ArenaUser }): Promise<ArenaSurvey>

  clone(options: {
    name: string
    label: string
    lang: LanguageCode
    surveyId: number
    user: ArenaUser
  }): Promise<ArenaJobSerialized<any>>

  // ==== READ
  count(options: { user: ArenaUser }): Promise<number>

  getAllIds(): Promise<Array<number>>

  getMany(options: { limit?: number; offset?: number; user: ArenaUser }): Promise<Array<ArenaSurvey>>

  get(options: {
    draft?: boolean
    nodeDefOptions?: { advanced?: boolean; cycle?: string; deleted?: boolean; draft?: boolean; include: boolean }
    surveyId: number
    validate?: boolean
    backup?: boolean
  }): Promise<ArenaSurvey>

  // ==== UPDATE
  update(options: { props: ArenaSurveyProps; surveyId: number; user: ArenaUser }): Promise<ArenaSurvey>

  publish(options: { surveyId: number; user: ArenaUser }): Promise<ArenaJobSerialized<any>>

  // ==== DELETE
  delete(options: { surveyId: number; user: ArenaUser }): Promise<void>
}
