export type RecordStep = {
  id: string
  name: string
}

export enum RecordStepNames {
  Entry = 'entry',
  Cleansing = 'cleansing',
  Analysis = 'analysis',
}

export const RecordStepEntryCode = '1'
export const RecordStepCleansingCode = '2'
export const RecordStepAnalysisCode = '3'

export const RecordStepsDictionary = {
  [RecordStepEntryCode]: { id: RecordStepEntryCode, name: RecordStepNames.Entry },
  [RecordStepCleansingCode]: { id: RecordStepCleansingCode, name: RecordStepNames.Cleansing },
  [RecordStepAnalysisCode]: { id: RecordStepAnalysisCode, name: RecordStepNames.Analysis },
}

export const RecordStepsList: RecordStep[] = Object.values(RecordStepsDictionary)

const getStepById = (id: string): RecordStep | undefined => {
  return RecordStepsList.find((step) => step.id === id)
}

const getStepByName = (name: string): RecordStep | undefined => RecordStepsList.find((step) => step.name === name)

export const RecordSteps = {
  getStepById,
  getStepByName,
}
