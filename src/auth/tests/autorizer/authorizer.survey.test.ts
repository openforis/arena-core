import { canEditSurveyQueries } from './survey/canEditSurvey'
import { canViewSurveyQueries } from './survey/canViewSurvey'

import { testQueries, Query } from './common'

const queries: Query[] = [...canEditSurveyQueries, ...canViewSurveyQueries]

describe('Authorizer - Survey', testQueries(queries))
