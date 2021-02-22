import { AuthGroup } from '../auth'
import { Cycle } from '../cycle'
import { Labels } from '../labels'
import { SRS } from '../srs'

export interface SurveyInfoProps {
  cycles: Cycle
  descriptions: Labels
  languages: Array<string>
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
