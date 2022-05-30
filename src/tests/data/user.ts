import { User, UserFactory } from '../../auth'

export const createTestAdminUser = (): User =>
  UserFactory.createInstance({ email: 'test@openforis-arena.org', name: 'test' })
