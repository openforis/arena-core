import sizeof from 'object-sizeof'

import { NodeDef, NodeDefType } from '../nodeDef'
import surveyExampleJson from '../tests/data/surveyExample.json'
import { Queue } from '../utils'
import { Survey } from './survey'
import { EntityDefObj, NodeDefObj, SurveyObj } from './surveyObj'
import { Surveys } from './surveys'

const nodeDefsCount = 227
const traverseTimesArr = [10, 100, 1000, 10000, 100000]

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

    const survey = Surveys.buildAndAssocNodeDefsIndex(surveyExampleJson as unknown as Survey)

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
})
