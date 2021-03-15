import { testQueries } from './common'
import { canEditSurveyQueries } from './survey/canEditSurvey'
import { canViewSurveyQueries } from './survey/canViewSurvey'

describe('Authorizer - Survey', testQueries([...canEditSurveyQueries, ...canViewSurveyQueries]))
