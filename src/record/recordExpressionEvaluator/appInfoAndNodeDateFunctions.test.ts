import { beforeAll, describe, expect, test } from '@jest/globals'

import { ArenaAppInfo } from '../../app'
import { ArenaUser } from '../../auth'
import { ArenaSurvey, Surveys } from '../../survey'
import { RecordBuilder, RecordNodeBuilders } from '../../tests/builder/recordBuilder'
import { SurveyBuilder, SurveyObjectBuilders } from '../../tests/builder/surveyBuilder'
import { createTestAdminUser } from '../../tests/data'
import { TestUtils } from '../../tests/testUtils'
import { ArenaRecord } from '../record'
import { Records } from '../records'
import { RecordExpressionEvaluator } from './recordExpressionEvaluator'
// imported after the survey modules (circular dependency)
import { NodeDefExpressionEvaluator } from '../../nodeDefExpressionEvaluator'

const { entityDef, integerDef, textDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

const appInfo: ArenaAppInfo = { appId: 'arena-mobile', version: '1.2.3', platform: 'ios' }

let user: ArenaUser
let survey: ArenaSurvey
let record: ArenaRecord

const getNode = (path: string) => TestUtils.getNodeByPath({ survey, record, path })

// evaluates the expression in the context of the parent entity of the specified attribute (as for default values)
const evaluate = (params: { query: string; attributePath: string; appInfo?: ArenaAppInfo }) => {
  const { query, attributePath } = params
  const nodeCtx = Records.getParent(getNode(attributePath))(record)!
  return new RecordExpressionEvaluator().evalExpression({
    user,
    survey,
    record,
    node: nodeCtx,
    query,
    appInfo: params.appInfo,
  })
}

describe('Expression functions: app info and node dates', () => {
  beforeAll(async () => {
    user = createTestAdminUser()
    survey = await new SurveyBuilder(
      user,
      entityDef(
        'root_entity',
        integerDef('identifier').key(),
        entityDef('plot', integerDef('plot_id').key(), textDef('plot_notes')).multiple()
      )
    ).build()
    record = new RecordBuilder(
      user,
      survey,
      entity(
        'root_entity',
        attribute('identifier', 10),
        entity('plot', attribute('plot_id', 1), attribute('plot_notes', 'a')),
        entity('plot', attribute('plot_id', 2), attribute('plot_notes', 'b'))
      )
    ).build()
    // distinct dates, to check that the right node is used
    getNode('root_entity').dateModified = '2100-01-01T00:00:00.000Z'
    getNode('root_entity.plot[0]').dateCreated = '2100-01-02T00:00:00.000Z'
    getNode('root_entity.plot[0]').dateModified = '2100-01-03T00:00:00.000Z'
    getNode('root_entity.plot[0].plot_notes').dateModified = '2100-01-04T00:00:00.000Z'
  })

  test.each([
    { query: 'appId()', expected: 'arena-mobile' },
    { query: 'appVersion()', expected: '1.2.3' },
    { query: 'appPlatform()', expected: 'ios' },
  ])('$query', async ({ query, expected }) => {
    expect(await evaluate({ query, attributePath: 'root_entity.identifier', appInfo })).toBe(expected)
    // no app info available
    expect(await evaluate({ query, attributePath: 'root_entity.identifier' })).toBeNull()
  })

  test.each([
    {
      query: 'nodeDateModified(root_entity)',
      attributePath: 'root_entity.identifier',
      expected: '2100-01-01T00:00:00.000Z',
    },
    {
      query: 'nodeDateCreated(plot)',
      attributePath: 'root_entity.plot[0].plot_notes',
      expected: '2100-01-02T00:00:00.000Z',
    },
    {
      query: 'nodeDateModified(plot)',
      attributePath: 'root_entity.plot[0].plot_notes',
      expected: '2100-01-03T00:00:00.000Z',
    },
    {
      query: 'nodeDateModified(plot_notes)',
      attributePath: 'root_entity.plot[0].plot_id',
      expected: '2100-01-04T00:00:00.000Z',
    },
    // node set: not supported
    { query: 'nodeDateModified(plot)', attributePath: 'root_entity.identifier', expected: null },
  ])('$query (context: $attributePath)', async ({ query, attributePath, expected }) => {
    expect(await evaluate({ query, attributePath })).toBe(expected)
  })

  test('node def expressions: referenced node defs', async () => {
    const nodeDef = Surveys.getNodeDefByName({ survey, name: 'plot_notes' })
    const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' })
    const plotIdDef = Surveys.getNodeDefByName({ survey, name: 'plot_id' })
    const evaluator = new NodeDefExpressionEvaluator()
    const findReferences = (expression: string) =>
      evaluator.findReferencedNodeDefUuidsWithNodeDates({
        expression,
        survey,
        nodeDef,
        isContextParent: true,
        selfReferenceAllowed: false,
      })

    const entityRefs = await findReferences('nodeDateModified(parent(this))')
    expect([...entityRefs.nodeDateReferencedNodeDefUuids]).toEqual([plotDef.uuid])

    const attributeRefs = await findReferences('nodeDateCreated(plot_id)')
    expect([...attributeRefs.referencedNodeDefUuids]).toEqual([plotIdDef.uuid])
    expect(attributeRefs.nodeDateReferencedNodeDefUuids.size).toBe(0)

    // self reference not allowed
    await expect(
      evaluator.evalExpression({
        expression: 'nodeDateModified(this)',
        survey,
        nodeDef,
        isContextParent: true,
        selfReferenceAllowed: false,
      })
    ).rejects.toThrow()
  })
})
