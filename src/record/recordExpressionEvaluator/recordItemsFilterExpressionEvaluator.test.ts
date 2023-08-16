import { NodeDefCode } from '../../nodeDef'
import { Survey, Surveys } from '../../survey'
import { Node } from '../../node'
import { Record } from '../record'
import { RecordExpressionContext } from './context'
import { Records } from '../records'
import { createTestAdminUser, createTestRecord, createTestSurvey } from '../../tests/data'
import { TestUtils } from '../../tests/testUtils'
import { RecordExpressionEvaluator } from '../recordExpressionEvaluator'

type Query = {
  expression: string
  result?: any
  error?: Error
  node?: string
}

let survey: Survey
let record: Record

const getNode = (path: string): Node => TestUtils.getNodeByPath({ survey, record, path })

describe('RecordItemFilterExpressionEvaluator', () => {
  beforeAll(async () => {
    const user = createTestAdminUser()

    survey = createTestSurvey({ user })

    record = createTestRecord({ user, survey })
  }, 10000)
  const queries: Query[] = [{ expression: 'this.code > 1', node: 'cluster_region', result: ['2', '3'] }]

  queries.forEach((query: Query) => {
    const { expression, result, error: errorExpected = false, node } = query

    test(`${expression}${node ? ` (node: ${node})` : ''}`, () => {
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

        const items = Surveys.getCategoryItems({
          survey,
          categoryUuid: nodeCurrentDef.props.categoryUuid,
          parentItemUuid: parentCodeAttribute?.value?.itemUuid,
        })
        const filteredItems = items.filter((item) => {
          const context: RecordExpressionContext = {
            survey,
            record,
            nodeContext,
            nodeCurrent,
            object: nodeContext,
            item,
          }
          // const res = new RecordItemFilterExpressionEvaluator().evaluate(expression, context)
          const res = new RecordExpressionEvaluator().evaluate(expression, context)

          return res
        })

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
