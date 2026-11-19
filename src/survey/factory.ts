import { DEFAULT_SRS } from '../srs'

import { ArenaFactory } from '../common'
import { ArenaSurvey } from './survey'
import { ArenaLabels, LanguageCode } from '../language'
import { UUIDs } from '../utils'
import { ArenaAuthGroup, createDefaultAuthGroups } from '../auth/authGroup'

export type SurveyFactoryParams = {
  ownerUuid: string
  name: string
  label?: string
  languages?: LanguageCode[]
  published?: boolean
  draft?: boolean
  template?: boolean
  collectUri?: string
  descriptions?: ArenaLabels
  authGroups?: ArenaAuthGroup[]
}

// built at every call: default objects must not be shared between survey instances
const createDefaultParams = () => ({
  languages: [LanguageCode.en],
  published: false,
  draft: true,
  template: false,
  authGroups: createDefaultAuthGroups(),
})

export const SurveyFactory: ArenaFactory<ArenaSurvey, SurveyFactoryParams> = {
  createInstance: (params: SurveyFactoryParams): ArenaSurvey => {
    const { ownerUuid, name, label, languages, published, draft, collectUri, descriptions, authGroups, template } = {
      ...createDefaultParams(),
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
      template,
    }
  },
}
