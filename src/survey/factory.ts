import { Factory } from 'src/common'
import { Survey } from './survey'
import { Labels, LanguageCode } from 'src/language'

type SurveyFactoryParams = {
  ownerUuid: string,
  name: string,
  label?: string ,
  languages?: Array<LanguageCode>,
  published: boolean,
  draft: boolean,
  collectUri: string,
  descriptions?: Array<Labels>
}
export class SurveyFactory implements Factory<Survey> {
  createInstance(options: SurveyFactoryParams): Survey {
    const { 
      ownerUuid,
      name,
      // label = null,
      languages = ['en'],
      published = false,
      draft = true,
      collectUri = '',
      // descriptions = {}
    } = options
    return {
      id: 'a',
      uuid: 'aaaaaa', //uuidv4(),
      published,
      draft,
      ownerUuid,
      authGroups: [],
      props: {
        name,
        languages,
        //labels: label ? { languages[0]: label } : {},
        srs: [], //[R.omit([Srs.keys.wkt], Srs.latLonSrs)],
        cycles: {}, // [SurveyInfo.cycleOneKey]: SurveyCycle.newCycle(),
        //descriptions,
        collectUri
      }
    }
  }
}


/*
export const newSurvey = ({ ownerUuid, name, label = null, languages, published = false, draft = true, ...rest }) => ({
  [SurveyInfo.keys.uuid]: uuidv4(),
  [SurveyInfo.keys.props]: {
    [SurveyInfo.keys.name]: name,
    [SurveyInfo.keys.languages]: languages,
    [SurveyInfo.keys.labels]: label ? { [languages[0]]: label } : {},
    [SurveyInfo.keys.srs]: [R.omit([Srs.keys.wkt], Srs.latLonSrs)],
    [SurveyInfo.keys.cycles]: {
      [SurveyInfo.cycleOneKey]: SurveyCycle.newCycle(),
    },
    [Survey.infoKeys.descriptions]: descriptions,
    [Survey.infoKeys.collectUri]: collectUri,
    ...rest,
  },
  [SurveyInfo.keys.published]: published,
  [SurveyInfo.keys.draft]: draft,
  [SurveyInfo.keys.ownerUuid]: ownerUuid,
})
*/