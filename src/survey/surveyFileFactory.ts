import { Factory } from '../common'
import { Dates, UUIDs } from '../utils'
import { SurveyFile, SurveyFileProps } from './survey'

export enum SurveyFileType {
  surveyDocImage = 'surveyDocImage',
}

export type SurveyFileFactoryParams = {
  name?: SurveyFileProps['name']
  labels?: SurveyFileProps['labels'] | null
  size?: SurveyFileProps['size']
  type?: SurveyFileProps['type']
  temporary?: SurveyFileProps['temporary']
}

export const SurveyFileFactory: Factory<SurveyFile, SurveyFileFactoryParams> = {
  createInstance: (params: SurveyFileFactoryParams = {}): SurveyFile => {
    const { name, labels, size, type, temporary = false } = params

    return {
      uuid: UUIDs.v4(),
      dateCreated: Dates.nowFormattedForStorage(),
      props: {
        name,
        labels: labels ?? undefined,
        size,
        type,
        temporary,
      },
    }
  },
}
