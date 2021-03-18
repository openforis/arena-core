import { UserFactory } from '../../../../auth'
import { Survey, Surveys } from '../../../../survey'
import { Record, Records } from '../../../../record'
import { createTestRecord, createTestSurvey } from '../../../../tests/data'
import { RecordNodesFinder } from './recordNodesFinder'

let survey: Survey
let record: Record

describe('ReferencedNodes', () => {
  beforeAll(async () => {
    const user = UserFactory.createInstance({ email: 'test@arena.org', name: 'test' })

    survey = createTestSurvey({ user })

    record = createTestRecord({ user, survey })
  }, 10000)

  test('Context node: root', () => {
    const cluster = Records.getRoot(record)
    const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' })
    const plotsReferenced = RecordNodesFinder.findDescendantNodes({
      survey,
      record,
      nodeContext: cluster,
      nodeDefReferenced: plotDef,
    })
    const plotsExpected = Records.getChildren({ record, parentNode: cluster, childDefUuid: plotDef.uuid })
    expect(plotsReferenced.length).toBe(3)
    expect(plotsReferenced).toStrictEqual(plotsExpected)
  })

  test('Context node: nested entity', () => {
    const cluster = Records.getRoot(record)
    const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' })
    const plots = Records.getChildren({ record, parentNode: cluster, childDefUuid: plotDef.uuid })
    const plot2 = plots[1]
    const plotIdDef = Surveys.getNodeDefByName({ survey, name: 'plot_id' })
    const nodesReferenced = RecordNodesFinder.findDescendantNodes({
      survey,
      record,
      nodeContext: plot2,
      nodeDefReferenced: plotIdDef,
    })
    expect(nodesReferenced.length).toBe(1)
    const plotIdReferenced = nodesReferenced[0]
    const plotIdExpected = Records.getChild({ record, parentNode: plot2, childDefUuid: plotIdDef.uuid })
    expect(plotIdReferenced).toStrictEqual(plotIdExpected)
  })
})
