import { AuthGroup } from 'src/auth'
import { Labels, LanguageCode } from 'src/language'
import { SRS } from 'src/srs'

export interface SurveyCycle {
  dateEnd?: string
  dateStart: string
}

export interface SurveyInfoProps {
  cycles: {
    [key: string]: SurveyCycle
  }
  descriptions: Labels
  languages: Array<LanguageCode>
  labels: Labels
  name: string
  srs: Array<SRS>
}

export interface SurveyInfo {
  authGroups: Array<AuthGroup>
  dateCreated: string
  dateModified: string
  draft: boolean
  id: string
  ownerUuid: string
  props: SurveyInfoProps
  published: boolean
  uuid: string
}
