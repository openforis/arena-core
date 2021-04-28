import { CategoryItemService, CategoryService, CategoryLevelService } from '../category'
import { ChainNodeDefService, ChainService } from '../chain'
import { NodeService } from '../node'
import { NodeDefService } from '../nodeDef'
import { RecordService } from '../record'
import { SurveyService } from '../survey'
import { TaxonService, TaxonomyService } from '../taxonomy'
import { UserService } from '../auth'

import { ServiceRegistry } from './serviceRegistry'
import { ServiceType } from './serviceType'

import { categoryMock, CategoryServiceMock } from './tests/category'
import { categoryItemMock, CategoryItemServiceMock } from './tests/categoryItem'
import { categoryLevelMock, CategoryLevelServiceMock } from './tests/categoryLevel'
import { chainMock, ChainServiceMock } from './tests/chain'
import { chainNodeDefMock, ChainNodeDefServiceMock } from './tests/chainNodeDef'
import { nodeMock, NodeServiceMock } from './tests/node'
import { nodeDefMock, NodeDefServiceMock } from './tests/nodeDef'
import { recordMock, RecordServiceMock } from './tests/record'
import { surveyMock, SurveyServiceMock } from './tests/survey'
import { taxonMock, TaxonServiceMock } from './tests/taxon'
import { taxonomyMock, TaxonomyServiceMock } from './tests/taxonomy'
import { userMock, UserServiceMock } from './tests/user'

let serviceRegistry: ServiceRegistry

beforeAll(() => {
  serviceRegistry = ServiceRegistry.getInstance()
    .registerService(ServiceType.category, new CategoryServiceMock())
    .registerService(ServiceType.categoryItem, new CategoryItemServiceMock())
    .registerService(ServiceType.categoryLevel, new CategoryLevelServiceMock())
    .registerService(ServiceType.chain, new ChainServiceMock())
    .registerService(ServiceType.chainNodeDef, new ChainNodeDefServiceMock())
    .registerService(ServiceType.node, new NodeServiceMock())
    .registerService(ServiceType.nodeDef, new NodeDefServiceMock())
    .registerService(ServiceType.record, new RecordServiceMock())
    .registerService(ServiceType.survey, new SurveyServiceMock())
    .registerService(ServiceType.taxon, new TaxonServiceMock())
    .registerService(ServiceType.taxonomy, new TaxonomyServiceMock())
    .registerService(ServiceType.user, new UserServiceMock())
})

describe('ServiceRegistry', () => {
  test('CategoryService', async () => {
    const service: CategoryService = serviceRegistry.getService(ServiceType.category) as CategoryService
    const category = await service.get({ categoryUuid: 'category_uuid', surveyId: 1 })

    expect(service).not.toBeNull()
    expect(category.props.name).toBe(categoryMock.props.name)
  })

  test('CategoryItemService', async () => {
    const service: CategoryItemService = serviceRegistry.getService(ServiceType.categoryItem) as CategoryItemService
    const categoryItem = await service.get({ categoryUuid: 'category_uuid', surveyId: 1 })

    expect(service).not.toBeNull()
    expect(categoryItem.props.code).toBe(categoryItemMock.props.code)
  })

  test('CategoryLevelService', async () => {
    const service: CategoryLevelService = serviceRegistry.getService(ServiceType.categoryLevel) as CategoryLevelService
    const categoryLevel = await service.get({ categoryUuid: 'category_uuid', surveyId: 1 })

    expect(service).not.toBeNull()
    expect(categoryLevel.props.name).toBe(categoryLevelMock.props.name)
  })

  test('ChainService', async () => {
    const service: ChainService = serviceRegistry.getService(ServiceType.chain) as ChainService
    const chain = await service.get({ chainUuid: 'chain_uuid', surveyId: 1 })

    expect(service).toBeDefined()
    expect(chain.props.labels?.en).toBeDefined()
    expect(chain.props.labels?.en).toBe(chainMock.props.labels?.en)
    expect(chain.validation.valid).toBe(true)
  })

  test('ChainNodeDefService', async () => {
    const service: ChainNodeDefService = serviceRegistry.getService(ServiceType.chainNodeDef) as ChainNodeDefService
    const chainNodeDefs = await service.getMany({ chainUuid: '', entityDefUuid: '', surveyId: 0 })
    const chainNodeDef = chainNodeDefs[0]

    expect(service).toBeDefined()
    expect(chainNodeDefs.length).toBe(1)
    expect(chainNodeDef.chainUuid).toBe(chainNodeDefMock.chainUuid)
    expect(chainNodeDef.nodeDefUuid).toBe(chainNodeDefMock.nodeDefUuid)
    expect(chainNodeDef.props.active).toBe(true)
    expect(chainNodeDef.index).toBe(0)
  })

  test('NodeService', async () => {
    const service: NodeService = serviceRegistry.getService(ServiceType.node) as NodeService
    const node = await service.get({ nodeUuid: 'node_uuid', surveyId: 1 })

    expect(service).not.toBeNull()
    expect(node.recordUuid).toBe(nodeMock.recordUuid)
  })

  test('NodeDefService', async () => {
    const service: NodeDefService = serviceRegistry.getService(ServiceType.nodeDef) as NodeDefService
    const nodeDefs = await service.getMany({ surveyId: 1, user: userMock })
    const [nodeDef] = Object.values(nodeDefs)

    expect(service).not.toBeNull()
    expect(nodeDef.props.name).toBe(nodeDefMock.props.name)
  })

  test('RecordService', async () => {
    const service: RecordService = serviceRegistry.getService(ServiceType.record) as RecordService
    const record = await service.get({ recordUuid: 'record_uuid', surveyId: 1 })

    expect(service).not.toBeNull()
    expect(record.ownerUuid).toBe(recordMock.ownerUuid)
  })

  test('SurveyService', async () => {
    const service: SurveyService = serviceRegistry.getService(ServiceType.survey) as SurveyService
    const survey = await service.get({ surveyId: 1 })

    expect(service).not.toBeNull()
    expect(survey.props.name).toBe(surveyMock.props.name)
  })

  test('TaxonService', async () => {
    const service: TaxonService = serviceRegistry.getService(ServiceType.taxon) as TaxonService
    const taxon = await service.get({ surveyId: 1, taxonomyUuid: 'mock' })

    expect(service).not.toBeNull()
    expect(taxon.props.genus).toBe(taxonMock.props.genus)
  })

  test('TaxonomyService', async () => {
    const service: TaxonomyService = serviceRegistry.getService(ServiceType.taxonomy) as TaxonomyService
    const taxonomy = await service.get({ surveyId: 1, taxonomyUuid: 'mock' })

    expect(service).not.toBeNull()
    expect(taxonomy.props.name).toBe(taxonomyMock.props.name)
  })

  test('UserService', async () => {
    const service: UserService = serviceRegistry.getService(ServiceType.user) as UserService
    const user = await service.get({ userUuid: 'userUuid' })

    expect(service).not.toBeNull()
    expect(user).not.toBeNull()
    expect(user?.name).toBe(userMock.name)
  })
})
