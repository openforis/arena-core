import { AuthGroupName, User, UserFactory } from '../../auth'

export const createTestAdminUser = (): User => {
  const user = UserFactory.createInstance({
    email: 'test@openforis-arena.org',
    name: 'test',
    extra: { ['property_1']: 'prop_1' },
  })
  user.authGroups = [{ name: AuthGroupName.systemAdmin }]
  return user
}
