import { Survey } from 'src/survey'
import { SurveyFactory, SurveyFactoryParams } from '../../survey/factory'
import { Authorizer } from '../authorizer'
import { UserFactory, UserFactoryParams } from '../factory'
import { User } from '../user'

const checkPermission = (user: User, survey: Survey, authorizer: any, expectedResult: boolean) =>
  expect(authorizer(user, survey)).toBe(expectedResult)

describe('Authorizer', () => {
  describe('Survey', () => {
    test('canViewSurvey - User doesnt have survey group', () => {
      const userParams: UserFactoryParams = {
        email: 'email@email.com',
        name: 'user',
      }

      const user = UserFactory.createInstance(userParams)

      const surveyParams: SurveyFactoryParams = {
        name: 'survey_name',
        ownerUuid: user.uuid,
      }

      const survey = SurveyFactory.createInstance(surveyParams)
      checkPermission(user, survey, Authorizer.canViewSurvey, false)
    })

    test('canViewSurvey - User has survey group', () => {
      const userParams: UserFactoryParams = {
        email: 'email@email.com',
        name: 'user',
      }

      const user = UserFactory.createInstance(userParams)

      const surveyParams: SurveyFactoryParams = {
        name: 'survey_name',
        ownerUuid: user.uuid,
      }

      const survey = SurveyFactory.createInstance(surveyParams)
      checkPermission(user, survey, Authorizer.canViewSurvey, false)
    })
  })
})

/*


const _getSurveyUserGroup = (user: User, survey: Survey, includeSystemAdmin = true): AuthGroup | undefined =>
  Users.getAuthGroupBySurveyUuid(survey.uuid, includeSystemAdmin)(user)

const _hasSurveyPermission = (permission: Permission) => (user: User, survey: Survey) =>
  user &&
  survey &&
  (Users.isSystemAdmin(user) || Boolean(_getSurveyUserGroup(user, survey)?.permissions.includes(permission)))

// READ
const canViewSurvey = (user: User, survey: Survey): boolean => Boolean(_getSurveyUserGroup(user, survey))

export type UserFactoryParams = {
  email: string
  name: string
  status?: UserStatus
  title?: UserTitle
  groupUuid: string
}

export type SurveyFactoryParams = {
    ownerUuid: string
    name: string
    label?: string
    languages?: LanguageCode[]
    published?: boolean
    draft?: boolean
    collectUri?: string
    descriptions?: Labels
  }
  
  const defaultProps = {
    languages: [LanguageCode.en],
    published: false,
    draft: true,
  }
  */
