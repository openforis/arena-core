import { Node } from 'src/node'
import { Validation } from 'src/validation'

export interface Record {
  cycle: string
  dateCreated: string
  dateModified: string
  nodes: { [uuid: string]: Node }
  ownerName: string
  ownerUuid: string
  preview: boolean
  step: string
  surveyId: string
  surveyUuid: string
  uuid: string
  validation: Validation
}
