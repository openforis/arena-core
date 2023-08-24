import { SurveyBuilder, SurveyObjectBuilders } from '../tests/builder/surveyBuilder'
import { UserFactory } from '../auth'
import { Survey, Surveys } from '../survey'
import { NodeDefExpressionValidator } from './validator'
import { ExtraPropDataType } from '../extraProp'

const { booleanDef, decimalDef, entityDef, integerDef, taxonDef, taxon, taxonomy, textDef } = SurveyObjectBuilders

type Query = {
  expression: string
  nodeDef?: string
  validationResult: boolean
  referencedNodeDefNames?: Array<string>
  selfReferenceAllowed?: boolean
  itemsFilter?: boolean
}

let survey: Survey

describe('NodeDefExpressionValidator', () => {
  beforeAll(async () => {
    const user = UserFactory.createInstance({ email: 'test@openforis-arena.org', name: 'test' })

    survey = new SurveyBuilder(
      user,
      entityDef(
        'cluster',
        integerDef('cluster_id').key(),
        booleanDef('accessible'),
        textDef('remarks'),
        entityDef(
          'plot',
          integerDef('plot_id').key(),
          entityDef(
            'tree',
            integerDef('tree_id').key(),
            decimalDef('tree_height'),
            taxonDef('species', 'trees')
          ).multiple()
        ).multiple()
      )
    )
      .taxonomies(
        taxonomy('trees')
          .extraProps({
            max_height: { key: 'max_height', dataType: ExtraPropDataType.number },
          })
          .taxa(
            taxon('AFZ/QUA', 'Fabaceae', 'Afzelia', 'Afzelia quanzensis')
              .vernacularName('eng', 'Mahogany')
              .vernacularName('swa', 'Mbambakofi')
              .extra({ max_height: '200', max_dbh: '30' }),
            taxon('OLE/CAP', 'Oleacea', 'Olea', 'Olea capensis').extra({ max_height: '300', max_dbh: '40' })
          )
      )
      .build()
  }, 10000)

  const queries: Query[] = [
    // wrong node def name
    { expression: 'not_existent', validationResult: false },
    // sibling node defs
    { expression: 'accessible', nodeDef: 'accessible', validationResult: true, referencedNodeDefNames: ['accessible'] },
    // self reference not allowed
    {
      expression: 'accessible',
      nodeDef: 'accessible',
      validationResult: false,
      selfReferenceAllowed: false,
    },
    // parent of root entity should be undefined
    { expression: 'parent(cluster)', validationResult: true, referencedNodeDefNames: ['cluster'] },
    // computed expressions (access node at index)
    { expression: 'plot[0]', validationResult: true, referencedNodeDefNames: ['plot'] },
    {
      expression: '(accessible && cluster_id) || (accessible && plot[1].plot_id)',
      validationResult: true,
      referencedNodeDefNames: ['accessible', 'cluster_id', 'plot', 'plot_id'],
    },
    { expression: 'count(plot) == 2', validationResult: true, referencedNodeDefNames: ['plot'] },
    { expression: 'count(plot[plot_id == 1]) == 1', validationResult: true, referencedNodeDefNames: ['plot'] },
    {
      expression: 'sum(cluster.plot.tree.tree_height) == 110',
      validationResult: true,
      referencedNodeDefNames: ['cluster', 'plot', 'tree', 'tree_height'],
    },
    {
      expression: '/[a-z\\s]+/i.test(remarks)',
      validationResult: true,
      referencedNodeDefNames: ['remarks'],
    },
    {
      expression: `taxonProp('trees', 'max_height', species)`,
      nodeDef: 'tree_height',
      validationResult: true,
      referencedNodeDefNames: ['species'],
    },
    {
      expression: `taxonProp('unexisting_taxonomy_name', 'max_height' , species)`,
      nodeDef: 'tree_height',
      validationResult: false,
    },
    // items filter
    {
      expression: `this.max_height < 100`,
      nodeDef: 'species',
      itemsFilter: true,
      validationResult: true,
    },
    {
      expression: `this.invalid_prop == 1`,
      nodeDef: 'species',
      itemsFilter: true,
      validationResult: false,
    },
    // global objects
    {
      expression: 'String(cluster_id)',
      validationResult: true,
      referencedNodeDefNames: ['cluster_id'],
    },
  ]

  queries.forEach((query: Query) => {
    const {
      expression,
      validationResult: validationResultExpected,
      referencedNodeDefNames: referencedNodeDefNamesExpected = [],
      nodeDef,
      selfReferenceAllowed = true,
      itemsFilter = false,
    } = query

    test(`${expression}${nodeDef ? ` (nodeDef: ${nodeDef})` : ''}`, () => {
      const nodeDefCurrent = nodeDef
        ? Surveys.getNodeDefByName({ survey, name: nodeDef })
        : Surveys.getNodeDefRoot({ survey })

      const { validationResult, referencedNodeDefUuids } = new NodeDefExpressionValidator().validate({
        expression,
        survey,
        nodeDefCurrent,
        selfReferenceAllowed,
        itemsFilter,
      })

      expect(validationResult.valid).toBe(validationResultExpected)

      const rerencedNodeDefUuids = [...referencedNodeDefUuids.values()]
      const referencedNodeDefNames = rerencedNodeDefUuids.map(
        (nodeDefUuid) => Surveys.getNodeDefByUuid({ survey, uuid: nodeDefUuid }).props.name
      )
      referencedNodeDefNames.sort()
      expect(referencedNodeDefNamesExpected).toEqual(referencedNodeDefNames)
    })
  })
})
