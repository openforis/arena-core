import { NodeDefCode } from '../../nodeDef'
import { Survey, Surveys } from '../../survey'
import { Node } from '../../node'
import { Record } from '../record'
import { RecordExpressionContext } from './context'
import { Records } from '../records'
import { createTestAdminUser, createTestRecord, createTestSurvey } from '../../tests/data'
import { TestUtils } from '../../tests/testUtils'
import { RecordExpressionEvaluator } from '../recordExpressionEvaluator'
import { CategoryItem } from '../../category'

type Query = {
  expression: string
  node: string
  result: any
  error?: Error
}

const user = createTestAdminUser()
let survey: Survey
let record: Record

const getNode = (path: string): Node => TestUtils.getNodeByPath({ survey, record, path })

describe('RecordItemFilterExpressionEvaluator', () => {
  beforeAll(async () => {
    survey = await createTestSurvey({ user })

    record = createTestRecord({ user, survey })
  }, 10000)

  const queries: Query[] = [
    // "this" evaluated as code
    { expression: 'Number(this) > 1', node: 'cluster_region', result: ['2', '3'] },
    // use of item props
    { expression: 'Number(this.code) > 2', node: 'cluster_region', result: ['3'] },
    // use of item extra props
    { expression: 'this.prop3 < 2', node: 'cluster_region', result: ['1'] },
    { expression: 'this.prop3 > 10', node: 'cluster_region', result: ['3'] },
  ]

  queries.forEach((query: Query) => {
    const { expression, node, result, error: errorExpected = false } = query

    test(`${expression} (node: ${node})`, async () => {
      try {
        const nodeCurrent = node ? getNode(node) : Records.getRoot(record)
        if (!nodeCurrent) throw new Error(`Cannot find current node: ${node}`)

        const nodeCurrentDef = Surveys.getNodeDefByUuid({ survey, uuid: nodeCurrent.nodeDefUuid }) as NodeDefCode
        const nodeCurrentParent = Records.getParent(nodeCurrent)(record)
        if (!nodeCurrentParent) {
          throw new Error(`Cannot find context node: ${node}`)
        }
        const nodeContext = nodeCurrentParent

        const parentCodeAttribute = Records.getParentCodeAttribute({
          parentNode: nodeCurrentParent,
          nodeDef: nodeCurrentDef as NodeDefCode,
        })(record)

        const items: CategoryItem[] = Surveys.getCategoryItems({
          survey,
          categoryUuid: nodeCurrentDef.props.categoryUuid,
          parentItemUuid: parentCodeAttribute?.value?.itemUuid,
        })
        const filteredItems: CategoryItem[] = []
        for await (const item of items) {
          const context: RecordExpressionContext = {
            user,
            survey,
            record,
            nodeContext,
            nodeCurrent,
            object: nodeContext,
            item,
          }
          if (await new RecordExpressionEvaluator().evaluate(expression, context)) {
            filteredItems.push(item)
          }
        }
        const filteredItemCodes = filteredItems.map((item) => item.props.code)
        expect(filteredItemCodes).toEqual(result instanceof Function ? result() : result)
      } catch (error) {
        if (errorExpected) {
          expect(error).toEqual(errorExpected)
        } else {
          throw error
        }
      }
    })
  })
})
