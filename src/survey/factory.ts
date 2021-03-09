// TODO : Use srs factory
import { DEFAULT_SRS } from '../srs'

import { Factory } from 'src/common'
import { Survey } from './survey'
import { Labels, LanguageCode } from 'src/language'
import { v4 as uuidv4 } from 'uuid'

export type SurveyFactoryParams = {
  ownerUuid: string
  name: string
  label?: string | null
  languages?: LanguageCode[]
  published?: boolean
  draft?: boolean
  collectUri?: string
  descriptions?: Labels[]
}

const defaultProps = {
  label: null,
  languages: [LanguageCode.en],
  published: false,
  draft: true,
  collectUri: null,
  descriptions: null,
}

export const SurveyFactory: Factory<Survey> = {
  createInstance: (params: SurveyFactoryParams): Survey => {
    const { ownerUuid, name, label, languages, published, draft, collectUri, descriptions } = {
      ...defaultProps,
      ...params,
    }

    console.log(DEFAULT_SRS, DEFAULT_SRS.name)
    return {
      id: undefined,
      uuid: uuidv4(),
      published,
      draft,
      ownerUuid,
      authGroups: [],
      props: {
        name,
        languages,
        labels: label ? { [languages[0]]: label } : {},
        srs: [DEFAULT_SRS],
        cycles: {
          '0': {
            dateStart: new Date().toISOString().split('T')[0],
          },
        },
        descriptions,
        collectUri,
      },
    }
  },
}
