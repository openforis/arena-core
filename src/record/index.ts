import { Validation } from 'src/validation/index'

export interface Node {}
export interface Record {
  cycle: string
  dateCreated: string
  dateModified: string
  nodes: Array<Node>
  ownerName: string
  ownerUuid: string
  preview: boolean
  step: string
  surveyId: string
  surveyUuid: string
  uuid: string
  validation: Validation
}
