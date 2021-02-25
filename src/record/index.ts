import { Validation } from 'src/validation/index'

export interface Record {
  uuid: string
  ownerUuid: string
  step: string
  dateCreated: Date
  surveyUuid: string
  dateModified: Date
  ownerName: string
  clusterId: string
  measurement: string
  surveyId: string
  validation: Validation
}
