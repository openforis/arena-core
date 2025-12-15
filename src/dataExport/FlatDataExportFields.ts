import { CategoryItem, CategoryItems } from '../category'
import { DataQuery } from '../dataQuery'
import { NodeDef, NodeDefCode, NodeDefProps, NodeDefs, NodeDefType } from '../nodeDef'
import { Survey, Surveys } from '../survey'
import { Objects } from '../utils'
import { DataExportOptions } from './DataExportOptions'

const maxExpandedCategoryItems = 20

const visitCategoryItems = ({
  survey,
  nodeDef,
  itemVisitor,
}: {
  survey: Survey
  nodeDef: NodeDefCode
  itemVisitor: (item: CategoryItem) => void
}) => {
  const items = Surveys.getCategoryItemsByNodeDef({ survey, nodeDef })
  if (items.length <= maxExpandedCategoryItems) {
    items.forEach(itemVisitor)
  }
}

type Field = { name: string; type?: string } | string

type FieldsExtractor = (params: { survey: Survey; nodeDef: NodeDef<any>; options?: DataExportOptions }) => Array<Field>

enum FixedFields {
  recordCycle = 'record_cycle',
  dateCreated = 'date_created',
}

const getMainField = (nodeDef: NodeDef<any>) => NodeDefs.getName(nodeDef)

const getExpandedCategoryItemField = ({ nodeDef, item }: { nodeDef: NodeDefCode; item: CategoryItem }) =>
  `${getMainField(nodeDef)}__${CategoryItems.getCode(item)}`

const fieldsExtractorByNodeDefType: Partial<Record<NodeDefType, FieldsExtractor>> = {
  [NodeDefType.code]: ({ survey, nodeDef, options }) => {
    const { includeCategoryItemsLabels = false, expandCategoryItems = false } = options ?? {}

    const mainField = getMainField(nodeDef)
    const labelField = `${mainField}_label`

    if (!includeCategoryItemsLabels && !expandCategoryItems) {
      // keep only code field
      return [mainField]
    } else {
      const result = [mainField]
      if (includeCategoryItemsLabels && (NodeDefs.isSingle(nodeDef) || NodeDefs.isMultipleAttribute(nodeDef))) {
        // label field included only for single attributes or multiple attributes in their own table
        result.push(labelField)
      }
      if (expandCategoryItems) {
        // add expanded category items fields
        visitCategoryItems({
          survey,
          nodeDef: nodeDef as NodeDefCode,
          itemVisitor: (item) => {
            const itemField = getExpandedCategoryItemField({ nodeDef: nodeDef as NodeDefCode, item })
            result.push(itemField)
          },
        })
      }
      return result
    }
  },
  [NodeDefType.coordinate]: ({ nodeDef }) => {
    const fieldSuffixes = ['_x', '_y', '_srs']
    const additionalFields = NodeDefs.getCoordinateAdditionalFields(nodeDef)
    for (const additionalField of additionalFields) {
      fieldSuffixes.push(`_${additionalField}`)
    }
    const mainField = getMainField(nodeDef)
    return fieldSuffixes.map((suffix) => `${mainField}${suffix}`)
  },
  [NodeDefType.decimal]: ({ nodeDef }) => [{ name: getMainField(nodeDef), type: 'number' }],
  [NodeDefType.file]: ({ nodeDef }) =>
    ['_file_uuid', '_file_name'].map((suffix) => `${getMainField(nodeDef)}${suffix}`),
  [NodeDefType.integer]: ({ nodeDef }) => [{ name: getMainField(nodeDef), type: 'number' }],
  [NodeDefType.taxon]: ({ nodeDef }) =>
    ['', '_scientific_name', '_vernacular_name'].map((suffix) => `${getMainField(nodeDef)}${suffix}`),
}

const getFieldsByNodeDef = ({
  survey,
  nodeDef,
  options,
}: {
  survey: Survey
  nodeDef: NodeDef<NodeDefType, NodeDefProps>
  options?: DataExportOptions
}) => {
  const fieldsExtractor = fieldsExtractorByNodeDefType[NodeDefs.getType(nodeDef)]
  return fieldsExtractor?.({ survey, nodeDef, options }) ?? [getMainField(nodeDef)]
}

const getUuidColumnName = (nodeDef: NodeDef<any>) => `${NodeDefs.getName(nodeDef)}_uuid`

const getFlatDataExportFields = ({
  survey,
  query,
  options,
}: {
  survey: Survey
  query: DataQuery
  options?: DataExportOptions
}) => {
  const { addCycle, includeInternalUuids, includeDateCreated } = options || {}
  const entityDef = Surveys.getNodeDefByUuid({ survey, uuid: query.entityDefUuid! })

  const fields: Field[] = []
  if (includeInternalUuids) {
    const ancestorMultipleEntityDef = Surveys.getNodeDefAncestorMultipleEntity({ survey, nodeDef: entityDef })
    if (ancestorMultipleEntityDef) {
      const ancestorUuidColName = getUuidColumnName(ancestorMultipleEntityDef)
      fields.push(ancestorUuidColName)
    }
    fields.push(getUuidColumnName(entityDef))
  }
  if (addCycle) {
    // Cycle is 0-based
    fields.push(FixedFields.recordCycle)
  }
  if (includeDateCreated) {
    fields.push(FixedFields.dateCreated)
  }
  // Consider only user selected fields (from column node defs)
  const nodeDefUuidCols = query.attributeDefUuids ?? []
  const nodeDefCols = Surveys.getNodeDefsByUuids({ survey, uuids: nodeDefUuidCols })
  fields.push(...nodeDefCols.flatMap((nodeDefCol) => getFieldsByNodeDef({ survey, nodeDef: nodeDefCol, options })))
  return fields
}

// const getCsvExportFieldsAgg = ({
//   survey,
//   query,
//   options = {},
// }: {
//   survey: Survey
//   query: DataQuery
//   options?: DataExportOptions
// }) => {
//   const { includeCategoryItemsLabels = false } = options
//   const nodeDef = Surveys.getNodeDefByUuid({ survey, uuid: query.entityDefUuid! })

//   const fields: Field[] = []
//   // dimensions
//   for (const dimension of query.dimensions ?? []) {
//     const nodeDefDimension = Surveys.getNodeDefByUuid({ survey, uuid: dimension })
//     fields.push(...getFieldsByNodeDef({ survey, nodeDef: nodeDefDimension, options }))
//   }
//   // measures
//   for (const measure of query.measures ?? []) {
//     const [nodeDefUuid, aggFunctions ] = measure
//     const nodeDefMeasure = Surveys.getNodeDefByUuid({ survey, uuid: nodeDefUuid })
//     for (const aggFunction of aggFunctions) {
//       const fieldAlias = ColumnNodeDef.getColumnNameAggregateFunction({
//         nodeDef: nodeDefMeasure,
//         aggregateFn: aggFunction,
//       })
//       fields.push(fieldAlias)
//     }
//   }
//   return fields
// }

/**
 * For every category item of code attributes included in the query, adds a field to the CSV object; the field name is
 * obtained with getExpandedCategoryItemField and the value is true/false depending on whether the code attribute includes
 * the code of the category item.
 *
 * @param params - the parameters
 * @param params.survey - the survey
 * @param params.query - the data query
 * @returns
 */
const getTransformerExpandCategoryItems = ({ survey, query }: { survey: Survey; query: DataQuery }) => {
  const nodeDefUuidCols = query.attributeDefUuids ?? []
  const nodeDefCols = Surveys.getNodeDefsByUuids({ survey, uuids: nodeDefUuidCols })
  const nodeDefCodeCols = nodeDefCols.filter((nodeDef) => nodeDef.type === NodeDefType.code)
  return (obj: any) => {
    for (const nodeDef of nodeDefCodeCols) {
      const values = obj[NodeDefs.getName(nodeDef)]
      visitCategoryItems({
        survey,
        nodeDef: nodeDef as NodeDefCode,
        itemVisitor: (item) => {
          const code = CategoryItems.getCode(item)
          const colName = getExpandedCategoryItemField({ nodeDef: nodeDef as NodeDefCode, item })
          obj[colName] = values?.includes(code)
        },
      })
    }
    return obj
  }
}

// const getCsvObjectTransformerUniqueFileNames = ({ survey, query, uniqueFileNamesGenerator }) => {
//   const nodeDefUuidCols = query.attributeDefUuids ?? []
//   const nodeDefCols = Surveys.getNodeDefsByUuids({ survey, uuids: nodeDefUuidCols })
//   const nodeDefFileCols = nodeDefCols.filter((nodeDef) => nodeDef.type === NodeDefType.file)
//   if (Objects.isEmpty(nodeDefFileCols)) {
//     // No file columns
//     return null
//   }
//   const transformer = (obj: any) => {
//     for (const nodeDef of nodeDefFileCols) {
//       const fileUuidField = getFileUuidColumnName(nodeDef)
//       const fileUuid = obj[fileUuidField]
//       const fileNameField = getFileNameColumnName(nodeDef)
//       const fileName = obj[fileNameField]
//       if (fileUuid && Objects.isNotEmpty(fileName)) {
//         const uniqueFileName = uniqueFileNamesGenerator.generateUniqueFileName(fileName, fileUuid)
//         obj[fileNameField] = uniqueFileName
//       }
//     }
//     return obj
//   }
//   return transformer
// }

const transformerNullsToEmpty = (obj: any) => {
  for (const [key, value] of Object.entries(obj)) {
    if (Objects.isNil(value)) {
      obj[key] = ''
    }
  }
  return obj
}

const getFlatDataObjectTransformer = ({
  survey,
  query,
  options = {},
  nullsToEmpty = false,
  // keepFileNamesUnique = false, // if true, uniqueFileNamesGenerator must be specified
  // uniqueFileNamesGenerator = null, // required if keepFileNamesUnique is true
}: {
  survey: Survey
  query: DataQuery
  options: any
  nullsToEmpty?: boolean
}) => {
  const { expandCategoryItems = false } = options
  const transformers = []
  if (expandCategoryItems) {
    transformers.push(getTransformerExpandCategoryItems({ survey, query }))
  }
  if (nullsToEmpty) {
    transformers.push(transformerNullsToEmpty)
  }
  // if (keepFileNamesUnique && uniqueFileNamesGenerator) {
  //   const transformer = getCsvObjectTransformerUniqueFileNames({ survey, query, uniqueFileNamesGenerator })
  //   if (transformer) {
  //     transformers.push(transformer)
  //   }
  // }
  return { transformers }
}

export const FlatDataExportFields = {
  getFlatDataExportFields,
  getFlatDataObjectTransformer,
}
