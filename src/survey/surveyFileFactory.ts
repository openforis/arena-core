import { ArenaFactory } from '../common'
import { Dates, UUIDs } from '../utils'
import { ArenaSurveyFile, ArenaSurveyFileProps } from './survey'

export enum SurveyFileType {
  surveyDocImage = 'surveyDocImage',
}

export type ArenaSurveyFileFactoryParams = Pick<ArenaSurveyFileProps, 'name' | 'labels' | 'size' | 'type' | 'temporary'>

export const SurveyFileFactory: ArenaFactory<ArenaSurveyFile, ArenaSurveyFileFactoryParams> = {
  createInstance: (params: ArenaSurveyFileFactoryParams = {}): ArenaSurveyFile => {
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
