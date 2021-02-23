export enum StepName {
  entry = 'entry',
  cleansing = 'cleansing',
  analysis = 'analysis',
}

export type Step = {
  id: number
  name: StepName
}

export interface RecordStep {
  steps: Array<Step>
  id: string
  name: string
}
