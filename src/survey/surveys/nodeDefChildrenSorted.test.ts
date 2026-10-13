import { beforeAll, describe, expect, test } from '@jest/globals'

import { NodeDefEntityRenderType } from '../../nodeDef'
import { Survey, Surveys } from '../../survey'
import { SurveyBuilder, SurveyObjectBuilders } from '../../tests/builder/surveyBuilder'
import { createTestAdminUser } from '../../tests/data'

const { entityDef, integerDef, textDef } = SurveyObjectBuilders

const cycle = '0'
let survey: Survey

const getSortedChildrenNames = (surveyParam: Survey): (string | undefined)[] => {
  const tree = Surveys.getNodeDefByName({ survey: surveyParam, name: 'tree' })
  return Surveys.getNodeDefChildrenSorted({ survey: surveyParam, nodeDef: tree, cycle }).map(
    (child) => child.props.name
  )
}

describe('Surveys.getNodeDefChildrenSorted', () => {
  beforeAll(async () => {
    survey = await new SurveyBuilder(
      createTestAdminUser(),
      entityDef(
        'cluster',
        integerDef('cluster_id').key(),
        entityDef('tree', integerDef('tree_id').key(), textDef('species'), integerDef('dbh')).multiple()
      )
    ).build()
  }, 10000)

  test('children sorted as in the table layout', () => {
    const tree = Surveys.getNodeDefByName({ survey, name: 'tree' })
    const uuidByName = (name: string) => Surveys.getNodeDefByName({ survey, name }).uuid
    const treeWithLayout = {
      ...tree,
      props: {
        ...tree.props,
        layout: {
          [cycle]: {
            renderType: NodeDefEntityRenderType.table,
            layoutChildren: [uuidByName('dbh'), uuidByName('tree_id'), uuidByName('species')],
          },
        },
      },
    }
    const surveyWithLayout: Survey = { ...survey, nodeDefs: { ...survey.nodeDefs, [tree.uuid]: treeWithLayout } }

    expect(getSortedChildrenNames(surveyWithLayout)).toEqual(['dbh', 'tree_id', 'species'])
  })
})
