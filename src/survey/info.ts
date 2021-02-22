import { v4 } from 'uuid'

import { AuthGroup } from '../common/authGroup'
import { Cycle } from '../common/cycle'
import { Labels } from '../common/labels'
import { SRS } from '../common/srs'

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
  ownerUuid: typeof v4
  published: boolean
  props: SurveyInfoProps
  uuid: string
}
