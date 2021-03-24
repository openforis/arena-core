import { DEFAULT_SRS } from '../srs'

import { Factory } from '../common'
import { Survey } from './survey'
import { Labels, LanguageCode } from 'src/language'
import { UUIDs } from '../utils'
import { AuthGroup, DEFAULT_AUTH_GROUPS } from '../auth/authGroup'

export type SurveyFactoryParams = {
  ownerUuid: string
  name: string
  label?: string
  languages?: LanguageCode[]
  published?: boolean
  draft?: boolean
  collectUri?: string
  descriptions?: Labels
  authGroups?: AuthGroup[]
}

const defaultProps = {
  languages: [LanguageCode.en],
  published: false,
  draft: true,
  authGroups: DEFAULT_AUTH_GROUPS,
}

export const SurveyFactory: Factory<Survey, SurveyFactoryParams> = {
  createInstance: (params: SurveyFactoryParams): Survey => {
    const { ownerUuid, name, label, languages, published, draft, collectUri, descriptions, authGroups } = {
      ...defaultProps,
      ...params,
    }

    return {
      id: undefined,
      uuid: UUIDs.v4(),
      published,
      draft,
      ownerUuid,
      authGroups,
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
