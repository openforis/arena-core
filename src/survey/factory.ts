import { Factory } from 'src/common'
import { SurveyInfo, SurveyInfoProps } from './info'
import { Survey } from './survey'

export class SurveyInfoPropsFactory implements Factory<SurveyInfoProps> {
  createInstance(options: SurveyInfoProps): SurveyInfoProps {
    return { ...options }
  }
}

export class SurveyInfoFactory implements Factory<SurveyInfo> {
  createInstance(options: SurveyInfo): SurveyInfo {
    return {
      ...options,
    }
  }
}

export class SurveyFactory implements Factory<Survey> {
  createInstance(options: Survey): Survey {
    return {
      info: new SurveyInfoFactory().createInstance(options.info),
    }
  }
}
