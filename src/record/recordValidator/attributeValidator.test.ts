import { describe, test, expect, beforeAll } from '@jest/globals'

import { SurveyBuilder, SurveyObjectBuilders } from '../../tests/builder/surveyBuilder'
import { RecordBuilder, RecordNodeBuilders } from '../../tests/builder/recordBuilder'
import { createTestAdminUser } from '../../tests/data'
import { TestUtils } from '../../tests/testUtils'
import { User } from '../../auth'
import { CategoryItem, CategoryItemFactory } from '../../category'
import { CategoryItemProvider } from '../../nodeDefExpressionEvaluator/categoryItemProvider'
import { ExtraPropDataType } from '../../extraProp'
import { Surveys } from '../../survey'
import { Validations } from '../../validation'
import { RecordValidations } from '../recordValidations'
import { RecordValidator } from './index'

const { category, categoryItem, codeDef, entityDef, textDef } = SurveyObjectBuilders
const { entity, attribute } = RecordNodeBuilders

let user: User

describe('Attribute validator - validation expressions', () => {
  beforeAll(async () => {
    user = createTestAdminUser()
  }, 10000)

  test('categoryItemProp on an item of a "big" category (not in the survey ref data index) uses the categoryItemProvider', async () => {
    const categoryName = 'sampling_point'

    const survey = await new SurveyBuilder(
      user,
      entityDef(
        'plot',
        codeDef('plot_id', categoryName)
          .key()
          .validationExpressions(`categoryItemProp('${categoryName}', 'lot', this) == contract_lot`),
        textDef('contract_lot')
      )
    )
      .categories(
        category(categoryName)
          .extraProps({ lot: { key: 'lot', dataType: ExtraPropDataType.text } })
          .items(categoryItem('1').extra({ lot: '4' }))
      )
      .build()

    const categoryUuid = Surveys.getCategoryByName({ survey, categoryName })!.uuid
    const item1 = TestUtils.getCategoryItem({ survey, categoryName, codePaths: ['1'] })

    // item known only by the categoryItemProvider (e.g. fetched from the DB)
    const bigItem: CategoryItem = CategoryItemFactory.createInstance({
      levelUuid: item1.levelUuid!,
      props: { code: '2', extra: { lot: '5' } },
    })
    const categoryItemProvider: CategoryItemProvider = {
      getItemByCodePaths: async ({ categoryUuid: categoryUuidParam, codePaths }) =>
        categoryUuidParam === categoryUuid && codePaths.join() === '2' ? bigItem : undefined,
      getItems: async () => [],
      getItemByUuid: async ({ itemUuid }) => (itemUuid === bigItem.uuid ? bigItem : undefined),
    }

    const record = new RecordBuilder(
      user,
      survey,
      entity('plot', attribute('plot_id', { itemUuid: bigItem.uuid }), attribute('contract_lot', '5'))
    ).build()

    const plotIdNode = TestUtils.getNodeByPath({ survey, record, path: 'plot.plot_id' })
    // ref data attached to the node, as when the record is fetched from the DB
    plotIdNode.refData = { categoryItem: bigItem }

    const validation = await RecordValidator.validateNodes({
      user,
      survey,
      record,
      nodes: { [plotIdNode.uuid]: plotIdNode },
      categoryItemProvider,
    })
    const plotIdValidation = RecordValidations.getValidationNode({ nodeUuid: plotIdNode.uuid })(validation)
    expect(Validations.isValid(plotIdValidation)).toBe(true)
  })
})
