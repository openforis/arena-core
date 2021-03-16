import { User } from '../auth'
import { JobSummary } from '../job'
import { LanguageCode } from '../language'
import { Survey, SurveyProps } from './survey'

export interface SurveyService {
  // ==== CREATE
  create(options: { name: string; label: string; lang: LanguageCode; user: User }): Promise<Survey>

  clone(options: {
    name: string
    label: string
    lang: LanguageCode
    surveyId: number
    user: User
  }): Promise<JobSummary<any>>

  // ==== READ
  count(options: { user: User }): Promise<number>

  getMany(options: { limit?: number; offset?: number; user: User }): Promise<Array<Survey>>

  get(options: {
    draft?: boolean
    nodeDefOptions?: { advanced?: boolean; cycle?: string; deleted?: boolean; draft?: boolean; include: boolean }
    surveyId: number
    user: User
    validate?: boolean
  }): Promise<Survey>

  // ==== UPDATE
  update(options: { props: SurveyProps; surveyId: number; user: User }): Promise<Survey>

  publish(options: { surveyId: number; user: User }): Promise<JobSummary<any>>

  // ==== DELETE
  delete(options: { surveyId: number; user: User }): Promise<void>
}
