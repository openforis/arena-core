import sizeof from 'object-sizeof'
import memoize from 'fast-memoize'

import { NodeDef, NodeDefType } from '../nodeDef'
import surveyExampleJson from '../tests/data/surveyExample.json'
import { Queue } from '../utils'
import { Survey } from './survey'
import { EntityDefObj, NodeDefObj, SurveyObj } from './surveyObj'
import { Surveys } from './surveys'

const nodeDefsCount = 227
const traverseTimesArr = [10, 100, 1000, 10000]

class Cache {
  store: { [key: string]: any }

  constructor() {
    this.store = {}
  }

  has(key: string) {
    return key in this.store
  }

  get(key: string) {
    return this.store[key]
  }

  set(key: string, value: any) {
    this.store[key] = value
  }
}

const traverseSurvey = (survey: Survey) => {
  let visitedNodesCount = 0
  const queue = new Queue()
  queue.enqueue(Surveys.getNodeDefRoot({ survey }))

  while (!queue.isEmpty()) {
    const nodeDef: NodeDef<any> = queue.dequeue()
    // get by uuid
    Surveys.getNodeDefByUuid({ survey, uuid: nodeDef.uuid })
    // get by name
    Surveys.getNodeDefByName({ survey, name: nodeDef.props.name || '' })
    // get parent
    Surveys.getNodeDefParent({ survey, nodeDef })
    // get children
    if (nodeDef.type === NodeDefType.entity) {
      const children = Surveys.getNodeDefChildren({ survey, nodeDef })
      queue.enqueueItems(children)
    }
    visitedNodesCount += 1
  }
  return visitedNodesCount
}

let cacheGetNodeByUuid: any = null
let cacheGetNodeDefByName: any = null
let cacheGetNodeDefParent: any = null
let cacheGetNodeDefChildren: any = null

const traverseSurveyObject = (survey: SurveyObj) => {
  let visitedNodesCount = 0
  const queue = new Queue()
  queue.enqueue(survey.root)

  while (!queue.isEmpty()) {
    const nodeDef: NodeDefObj = queue.dequeue()
    // get by uuid
    survey.getNodeDefByUuid(nodeDef.uuid)
    // get by name
    survey.getNodeDefByName(nodeDef.props?.name || '')
    // get parent
    nodeDef.parent
    // get children
    if (nodeDef.type === NodeDefType.entity) {
      const children = (nodeDef as EntityDefObj).getChildren()
      queue.enqueueItems(children)
    }
    visitedNodesCount += 1
  }
  return visitedNodesCount
}

const traverseSurveyWithMemoize = (survey: Survey) => {
  let visitedNodesCount = 0
  const queue = new Queue()
  queue.enqueue(Surveys.getNodeDefRoot({ survey }))

  const getNodeByUuid = memoize(Surveys.getNodeDefByUuid, {
    serializer: (params: any) => `${params.survey.uuid}-${params.uuid}`,
    cache: {
      create() {
        cacheGetNodeByUuid = new Cache()
        return cacheGetNodeByUuid
      },
    },
  })
  const getNodeDefByName = memoize(Surveys.getNodeDefByName, {
    serializer: (params: any) => `${params.survey.uuid}-${params.name}`,
    cache: {
      create() {
        cacheGetNodeDefByName = new Cache()
        return cacheGetNodeDefByName
      },
    },
  })
  const getNodeDefParent = memoize(Surveys.getNodeDefParent, {
    serializer: (params: any) => `${params.survey.uuid}-${params.nodeDef.uuid}`,
    cache: {
      create() {
        cacheGetNodeDefParent = new Cache()
        return cacheGetNodeDefParent
      },
    },
  })
  const getNodeDefChildren = memoize(Surveys.getNodeDefChildren, {
    serializer: (params: any) => `${params.survey.uuid}-${params.nodeDef.uuid}`,
    cache: {
      create() {
        cacheGetNodeDefChildren = new Cache()
        return cacheGetNodeDefChildren
      },
    },
  })

  while (!queue.isEmpty()) {
    const nodeDef: NodeDef<any> = queue.dequeue()
    // get by uuid
    getNodeByUuid({ survey, uuid: nodeDef.uuid })
    // get by name
    getNodeDefByName({ survey, name: nodeDef.props.name || '' })
    // get parent
    getNodeDefParent({ survey, nodeDef })
    // get children
    if (nodeDef.type === NodeDefType.entity) {
      const children = getNodeDefChildren({ survey, nodeDef })
      queue.enqueueItems(children)
    }
    visitedNodesCount += 1
  }

  return visitedNodesCount
}

const traverse = (params: { label: string; traverseFn: (survey: any) => number; survey: any }) => {
  const { label: labelPrefix, survey, traverseFn } = params

  traverseTimesArr.forEach((traverseTimes) => {
    const label = `${labelPrefix}-${traverseTimes}-traverse-times`
    console.time(label)
    let totalVisitedNodesCount = 0
    for (let index = 0; index < traverseTimes; index++) {
      totalVisitedNodesCount += traverseFn(survey)
    }
    console.timeEnd(label)
    expect(totalVisitedNodesCount).toBe(traverseTimes * nodeDefsCount)
  })

  console.log(process.memoryUsage())

  const totalMomoizedCacheSize =
    sizeof(Object.keys(cacheGetNodeByUuid?.store || {})) +
    sizeof(Object.keys(cacheGetNodeDefByName?.store || {})) +
    sizeof(Object.keys(cacheGetNodeDefParent?.store || {})) +
    sizeof(Object.keys(cacheGetNodeDefChildren?.store || {}))

  console.log(`total size of memoized cache: ${totalMomoizedCacheSize}`)
}

describe('Survey Performance Comparator', () => {
  test('Survey with node def index', () => {
    const label = 'survey-without-index'

    console.time(label)

    const survey = surveyExampleJson as unknown as Survey

    console.log(`size of ${label}: ${sizeof(survey)}`)

    traverse({ label, survey, traverseFn: traverseSurvey })

    console.timeEnd(label)
  })

  test('Survey with node def index', () => {
    const label = 'survey-with-index'

    console.time(label)

    const survey = Surveys.buildAndAssocNodeDefsIndex({ ...(surveyExampleJson as unknown as Survey) })

    console.log(`size of ${label}: ${sizeof(survey)}`)

    traverse({ label, survey, traverseFn: traverseSurvey })

    console.timeEnd(label)
  })

  test('Survey class', () => {
    const label = 'survey-class'

    console.time(label)

    const survey: SurveyObj = new SurveyObj(surveyExampleJson as unknown as Survey)

    console.log(`size of ${label}: ${sizeof(survey)}`)

    traverse({ label, survey, traverseFn: traverseSurveyObject })

    console.timeEnd(label)
  })

  test('Survey with fast-memoize', () => {
    const label = 'survey-memoized'

    console.time(label)

    const survey = surveyExampleJson as unknown as Survey

    console.log(`size of ${label}: ${sizeof(survey)}`)

    traverse({ label, survey, traverseFn: traverseSurveyWithMemoize })

    console.timeEnd(label)
  })
})
