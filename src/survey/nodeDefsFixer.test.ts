import { NodeDefEntity, NodeDefs } from '../nodeDef'
import { NodeDefsFixer, Survey, Surveys } from '../survey'
import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { createTestAdminUser } from '../tests/data'
import { Objects, UUIDs } from '../utils'

const { booleanDef, entityDef, integerDef } = SurveyObjectBuilders

let survey: Survey

describe('Survey NodeDefsFixer', () => {
  beforeEach(async () => {
    const user = createTestAdminUser()

    survey = new SurveyBuilder(
      user,
      entityDef(
        'cluster',
        integerDef('cluster_id').key(),
        integerDef('cluster_attr'),
        booleanDef('accessible'),
        entityDef('plot', integerDef('plot_id').key(), integerDef('plot_attribute')).multiple()
      )
    ).build()

    const cycle = '0'
    const rootDef = Surveys.getNodeDefRoot({ survey })
    const clusterIdDef = Surveys.getNodeDefByName({ survey, name: 'cluster_id' })
    const clusterAttrDef = Surveys.getNodeDefByName({ survey, name: 'cluster_attr' })
    const plotDef: NodeDefEntity = Surveys.getNodeDefByName({ survey, name: 'plot' }) as NodeDefEntity
    const plotPageUuid = UUIDs.v4()
    Objects.setInPath({ obj: plotDef, path: ['props', 'layout', cycle, 'pageUuid'], value: plotPageUuid })

    const rootLayoutChildren = [
      { i: clusterIdDef.uuid, x: 0, y: 0 },
      { i: clusterAttrDef.uuid, x: 0, y: 1 },
    ]
    Objects.setInPath({ obj: rootDef, path: ['props', 'layout', cycle, 'layoutChildren'], value: rootLayoutChildren })
    const rootLayoutIndexChildren = [plotDef.uuid]
    Objects.setInPath({
      obj: rootDef,
      path: ['props', 'layout', cycle, 'indexChildren'],
      value: rootLayoutIndexChildren,
    })
  })

  test('Hierarchy fixed', () => {
    const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' })
    plotDef.meta.h.unshift('NOT_EXISTING_NODE_DEF_UUID')

    const { nodeDefs, updatedNodeDefs } = NodeDefsFixer.fixNodeDefs({ nodeDefs: survey.nodeDefs!, cycles: ['0'] })

    const updatedNodeDefsArray = Object.values(updatedNodeDefs)
    // all node defs in "nodeDefs"
    expect(Object.values(nodeDefs).length).toBe(7)
    // expect 1 updated node def (plot)
    expect(updatedNodeDefsArray.length).toBe(1)
    expect(NodeDefs.getName(updatedNodeDefsArray[0])).toBe('plot')
    // expect same node defs objects in nodeDefs and updatedNodeDefs
    expect(updatedNodeDefs[plotDef.uuid]).toBe(nodeDefs[plotDef.uuid])
  })

  test('Layout index children fixed', () => {
    const cycle = '0'
    const rootDef = Surveys.getNodeDefRoot({ survey })
    const layoutIndexChildren = NodeDefs.getChildrenEntitiesInOwnPageUudis(cycle)(rootDef)
    layoutIndexChildren.push(UUIDs.v4()) // add a non existing uuid to indexChildren

    const { nodeDefs, updatedNodeDefs } = NodeDefsFixer.fixNodeDefs({ nodeDefs: survey.nodeDefs!, cycles: [cycle] })
    const updatedNodeDefsArray = Object.values(updatedNodeDefs)
    expect(Object.values(nodeDefs).length).toBe(7)
    expect(updatedNodeDefsArray.length).toBe(1)
    const updatedNodeDef = updatedNodeDefsArray[0]
    expect(NodeDefs.getName(updatedNodeDef)).toBe('cluster')

    const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' })
    expect(NodeDefs.getChildrenEntitiesInOwnPageUudis(cycle)(updatedNodeDef)).toEqual([plotDef.uuid])
  })

  test('Layout children fixed', () => {
    const cycle = '0'
    const rootDef = Surveys.getNodeDefRoot({ survey })
    const plotDef = Surveys.getNodeDefByName({ survey, name: 'plot' })
    const layoutChildren = NodeDefs.getLayoutChildren(cycle)(rootDef)
    layoutChildren.push({ i: plotDef.uuid, x: 0, y: 2 }) // add plot def in layout children (it has its own page, it cannot be in layoutChildren)

    const { nodeDefs, updatedNodeDefs } = NodeDefsFixer.fixNodeDefs({ nodeDefs: survey.nodeDefs!, cycles: [cycle] })
    const updatedNodeDefsArray = Object.values(updatedNodeDefs)
    expect(Object.values(nodeDefs).length).toBe(7)
    expect(updatedNodeDefsArray.length).toBe(1)
    const updatedNodeDef = updatedNodeDefsArray[0]
    expect(NodeDefs.getName(updatedNodeDef)).toBe('cluster')

    expect(NodeDefs.getLayoutChildren(cycle)(updatedNodeDef).length).toBe(2)
  })
})
