import { Node } from 'src/node'
import { Validation } from 'src/validation'

export const RECORD_STEP_DEFAULT = '1'

export const steps = ['entry', 'cleansing', 'analysis']

export interface Record {
  cycle?: string
  dateCreated?: string
  dateModified?: string
  nodes?: { [uuid: string]: Node }
  ownerName: string
  ownerUuid: string
  preview?: boolean
  step: string // in steps
  surveyId?: number
  surveyUuid?: string
  uuid: string
  validation?: Validation
}
