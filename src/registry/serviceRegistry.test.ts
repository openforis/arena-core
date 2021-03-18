import { CategoryItemService, CategoryService, CategoryLevelService } from '../category'
import { NodeService } from '../node'
import { NodeDefService } from '../nodeDef'
import { RecordService } from '../record'
import { SurveyService } from '../survey'
import { TaxonService, TaxonomyService } from '../taxonomy'
import { UserService } from '../auth'

import { ServiceRegistry, ServiceTypes } from './serviceRegistry'

import { categoryMock, CategoryServiceMock } from './tests/category'
import { categoryItemMock, CategoryItemServiceMock } from './tests/categoryItem'
import { categoryLevelMock, CategoryLevelServiceMock } from './tests/categoryLevel'
import { nodeMock, NodeServiceMock } from './tests/node'
import { nodeDefMock, NodeDefServiceMock } from './tests/nodeDef'

import { recordMock, RecordServiceMock } from './tests/record'
import { surveyMock, SurveyServiceMock } from './tests/survey'
import { taxonMock, TaxonServiceMock } from './tests/taxon'
import { taxonomyMock, TaxonomyServiceMock } from './tests/taxonomy'
import { userMock, UserServiceMock } from './tests/user'

beforeAll(() => {
  ServiceRegistry.getInstance()
    .registerService(ServiceTypes.category, new CategoryServiceMock())
    .registerService(ServiceTypes.categoryItem, new CategoryItemServiceMock())
    .registerService(ServiceTypes.categoryLevel, new CategoryLevelServiceMock())
    .registerService(ServiceTypes.node, new NodeServiceMock())
    .registerService(ServiceTypes.nodeDef, new NodeDefServiceMock())
    .registerService(ServiceTypes.record, new RecordServiceMock())
    .registerService(ServiceTypes.survey, new SurveyServiceMock())
    .registerService(ServiceTypes.taxon, new TaxonServiceMock())
    .registerService(ServiceTypes.taxonomy, new TaxonomyServiceMock())
    .registerService(ServiceTypes.user, new UserServiceMock())
})

describe('ServiceRegistry', () => {
  test('CategoryService', async () => {
    const service: CategoryService = ServiceRegistry.getInstance().getService(ServiceTypes.category)
    const category = await service.get({ categoryUuid: 'category_uuid', surveyId: 1 })

    expect(service).not.toBeNull()
    expect(category.props.name).toBe(categoryMock.props.name)
  })

  test('CategoryItemService', async () => {
    const service: CategoryItemService = ServiceRegistry.getInstance().getService(ServiceTypes.categoryItem)
    const categoryItem = await service.get({ categoryUuid: 'category_uuid', surveyId: 1 })

    expect(service).not.toBeNull()
    expect(categoryItem.props.code).toBe(categoryItemMock.props.code)
  })

  test('CategoryLevelService', async () => {
    const service: CategoryLevelService = ServiceRegistry.getInstance().getService(ServiceTypes.categoryLevel)
    const categoryLevel = await service.get({ categoryUuid: 'category_uuid', surveyId: 1 })

    expect(service).not.toBeNull()
    expect(categoryLevel.props.name).toBe(categoryLevelMock.props.name)
  })

  test('NodeService', async () => {
    const service: NodeService = ServiceRegistry.getInstance().getService(ServiceTypes.node)
    const node = await service.get({ nodeUuid: 'node_uuid', surveyId: 1 })

    expect(service).not.toBeNull()
    expect(node.recordUuid).toBe(nodeMock.recordUuid)
  })

  test('NodeDefService', async () => {
    const service: NodeDefService = ServiceRegistry.getInstance().getService(ServiceTypes.nodeDef)
    const nodeDefs = await service.getMany({ surveyId: 1, user: userMock })
    const [nodeDef] = Object.values(nodeDefs)

    expect(service).not.toBeNull()
    expect(nodeDef.props.name).toBe(nodeDefMock.props.name)
  })

  test('RecordService', async () => {
    const service: RecordService = ServiceRegistry.getInstance().getService(ServiceTypes.record)
    const record = await service.get({ recordUuid: 'record_uuid', surveyId: 1, cycle: 'cycle' })

    expect(service).not.toBeNull()
    expect(record.ownerUuid).toBe(recordMock.ownerUuid)
  })

  test('SurveyService', async () => {
    const service: SurveyService = ServiceRegistry.getInstance().getService(ServiceTypes.survey)
    const survey = await service.get({ surveyId: 1, user: userMock })

    expect(service).not.toBeNull()
    expect(survey.props.name).toBe(surveyMock.props.name)
  })

  test('TaxonService', async () => {
    const service: TaxonService = ServiceRegistry.getInstance().getService(ServiceTypes.taxon)
    const taxon = await service.get({ surveyId: 1, taxonomyUuid: 'mock' })

    expect(service).not.toBeNull()
    expect(taxon.props.genus).toBe(taxonMock.props.genus)
  })

  test('TaxonomyService', async () => {
    const service: TaxonomyService = ServiceRegistry.getInstance().getService(ServiceTypes.taxonomy)
    const taxonomy = await service.get({ surveyId: 1, taxonomyUuid: 'mock' })

    expect(service).not.toBeNull()
    expect(taxonomy.props.name).toBe(taxonomyMock.props.name)
  })

  test('UserService', async () => {
    const service: UserService = ServiceRegistry.getInstance().getService(ServiceTypes.user)
    const user = await service.get({ userUuid: 'userUuid' })

    expect(service).not.toBeNull()
    expect(user.name).toBe(userMock.name)
  })
})
