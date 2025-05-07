import { Survey, Surveys } from '../../../../survey'
import { Record, Records } from '../../..'
import { createTestAdminUser, createTestRecord, createTestSurvey } from '../../../../tests/data'
import { NodesFinder } from './nodesFinder'

let survey: Survey
let record: Record

const getRoot = () => {
  const root = Records.getRoot(record)
  if (!root) throw new Error('Root node not found')
  return root
}

describe('ReferencedNodes', () => {
  beforeAll(async () => {
    const user = createTestAdminUser()

    survey = await createTestSurvey({ user })

    record = createTestRecord({ user, survey })
  }, 10000)

  test('Context node: root', () => {
    const cluster = getRoot()
    const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' })
    const plotsReferenced = NodesFinder.findDescendants({
      survey,
      record,
      nodeContext: cluster,
      nodeDefReferenced: plotDef,
    })
    const plotsExpected = Records.getChildren(cluster, plotDef.uuid)(record)
    expect(plotsReferenced.length).toBe(3)
    expect(plotsReferenced).toStrictEqual(plotsExpected)
  })

  test('Context node: nested entity', () => {
    const cluster = getRoot()
    const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' })
    const plots = Records.getChildren(cluster, plotDef.uuid)(record)
    const plot2 = plots[1]
    const plotIdDef = Surveys.getNodeDefByName({ survey, name: 'plot_id' })
    const nodesReferenced = NodesFinder.findDescendants({
      survey,
      record,
      nodeContext: plot2,
      nodeDefReferenced: plotIdDef,
    })
    expect(nodesReferenced.length).toBe(1)
    const plotIdReferenced = nodesReferenced[0]
    const plotIdExpected = Records.getChild(plot2, plotIdDef.uuid)(record)
    expect(plotIdReferenced).toStrictEqual(plotIdExpected)
  })
})
