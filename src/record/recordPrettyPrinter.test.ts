import { describe, expect, test } from '@jest/globals'

import { Node, Nodes } from '../node'
import { Record, RecordPrettyPrinter, Records } from './index'
import { Surveys } from '../survey'
import { RecordBuilder, RecordNodeBuilders } from '../tests/builder/recordBuilder'
import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { createTestAdminUser } from '../tests/data'

const { entityDef, integerDef } = SurveyObjectBuilders
const { attribute, entity } = RecordNodeBuilders

const user = createTestAdminUser()

describe('RecordPrettyPrinter', () => {
  test('when includeEmptyNodes is false, missing nodes are not printed', async () => {
    const survey = await new SurveyBuilder(user, entityDef('root', integerDef('a'), integerDef('b'))).build()
    const record = new RecordBuilder(user, survey, entity('root', attribute('a', 10))).build()

    const printed = RecordPrettyPrinter.print({ survey, record })

    expect(printed).toContain('a: 10')
    expect(printed).not.toContain('b:')
  })

  test('when includeEmptyNodes is true, missing nodes are printed with child status info', async () => {
    const survey = await new SurveyBuilder(user, entityDef('root', integerDef('a'), integerDef('b'))).build()
    const bDef = Surveys.getNodeDefByName({ survey, name: 'b' })

    let record: Record = new RecordBuilder(user, survey, entity('root', attribute('a', 10))).build()
    const rootNode = Records.getRoot(record) as Node
    const rootNodeNotApplicable = Nodes.assocChildApplicability(rootNode, bDef.uuid, false)
    const rootNodeNotEditable = Nodes.assocChildEditable(rootNodeNotApplicable, bDef.uuid, false)
    const rootNodeNotVisible = Nodes.assocChildVisible(rootNodeNotEditable, bDef.uuid, false)
    record = Records.addNode(rootNodeNotVisible)(record)

    const printed = RecordPrettyPrinter.print({
      survey,
      record,
      options: {
        includeEmptyNodes: true,
        showNotApplicable: true,
        showNotEditable: true,
        showNotVisible: true,
      },
    })

    expect(printed).toContain('a: 10')
    expect(printed).toContain('b: <empty> (not applicable, not editable, not visible)')
  })
})
