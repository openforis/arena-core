import { CategoryItems } from '../category'
import { NodeValues } from '../node'
import { NodeDef, NodeDefCode, NodeDefs, NodeDefType } from '../nodeDef'
import { Survey, Surveys } from '../survey'
import { DataExportDefaultOptions, DataExportOptions } from './DataExportOptions'

export enum FlatDataExportColumnDataType {
  boolean = 'boolean',
  numeric = 'numeric',
  text = 'text',
}

export const getExpandedCategoryItemColumnHeader = ({ nodeDef, code }: { nodeDef: NodeDef<any>; code: string }) =>
  `${NodeDefs.getName(nodeDef)}__${code}`

const getMainColumn = ({ nodeDef, dataType }: { nodeDef: any; dataType: string }) => ({
  header: NodeDefs.getName(nodeDef),
  nodeDef,
  dataType,
})

type Column = {
  key?: boolean
  header: string
  nodeDef?: any
  dataType?: string
  valueProp?: string
}

type ColumnsExtractor = ({
  survey,
  nodeDef,
  options,
}: {
  nodeDef: NodeDef<any>
  survey: Survey
  options: DataExportOptions
}) => Column[]

const columnsExtractorByNodeDefType: Partial<Record<NodeDefType, ColumnsExtractor>> = {
  [NodeDefType.boolean]: ({ nodeDef }) => [getMainColumn({ nodeDef, dataType: FlatDataExportColumnDataType.boolean })],
  [NodeDefType.code]: ({ survey, nodeDef, options }) => {
    const nodeDefCode = nodeDef as NodeDefCode
    const { includeCategoryItemsLabels = false, expandCategoryItems = false } = options ?? {}
    const nodeDefName = NodeDefs.getName(nodeDef)
    const result = [
      {
        header: nodeDefName,
        nodeDef,
        dataType: FlatDataExportColumnDataType.text,
        valueProp: NodeValues.ValuePropsCode.code,
      },
    ]
    if (includeCategoryItemsLabels) {
      result.push({
        header: `${nodeDefName}_label`,
        nodeDef,
        dataType: FlatDataExportColumnDataType.text,
        valueProp: NodeValues.ValuePropsCode.label,
      })
    }
    if (expandCategoryItems) {
      const categoryUuid = NodeDefs.getCategoryUuid(nodeDefCode)!
      const levelIndex = Surveys.getNodeDefCategoryLevelIndex({ survey: survey!, nodeDef: nodeDefCode })
      const items = Surveys.getCategoryItemsInLevel({ survey, categoryUuid, levelIndex })
      items.forEach((item) => {
        result.push({
          header: getExpandedCategoryItemColumnHeader({ nodeDef, code: CategoryItems.getCode(item) }),
          nodeDef,
          dataType: FlatDataExportColumnDataType.boolean,
          valueProp: NodeValues.ValuePropsCode.code,
        })
      })
    }
    return result
  },
  [NodeDefType.coordinate]: ({ nodeDef }) => {
    const nodeDefName = NodeDefs.getName(nodeDef)
    return [
      {
        header: `${nodeDefName}_x`,
        nodeDef,
        dataType: FlatDataExportColumnDataType.numeric,
        valueProp: NodeValues.ValuePropsCoordinate.x,
      },
      {
        header: `${nodeDefName}_y`,
        nodeDef,
        dataType: FlatDataExportColumnDataType.numeric,
        valueProp: NodeValues.ValuePropsCoordinate.y,
      },
      {
        header: `${nodeDefName}_srs`,
        nodeDef,
        dataType: FlatDataExportColumnDataType.text,
        valueProp: NodeValues.ValuePropsCoordinate.srs,
      },
      ...NodeDefs.getCoordinateAdditionalFields(nodeDef).map((field) => ({
        header: `${nodeDefName}_${field}`,
        nodeDef,
        dataType: FlatDataExportColumnDataType.numeric,
        valueProp: field,
      })),
    ]
  },
  [NodeDefType.date]: ({ nodeDef }) => [getMainColumn({ nodeDef, dataType: FlatDataExportColumnDataType.text })],
  [NodeDefType.decimal]: ({ nodeDef }) => [getMainColumn({ nodeDef, dataType: FlatDataExportColumnDataType.numeric })],
  [NodeDefType.file]: ({ nodeDef }) => {
    const nodeDefName = NodeDefs.getName(nodeDef)
    return [
      {
        header: `${nodeDefName}_file_uuid`,
        nodeDef,
        dataType: FlatDataExportColumnDataType.text,
        valueProp: NodeValues.ValuePropsFile.fileUuid,
      },
      {
        header: `${nodeDefName}_file_name`,
        nodeDef,
        dataType: FlatDataExportColumnDataType.text,
        valueProp: NodeValues.ValuePropsFile.fileName,
      },
    ]
  },
  [NodeDefType.integer]: ({ nodeDef }) => [getMainColumn({ nodeDef, dataType: FlatDataExportColumnDataType.numeric })],
  [NodeDefType.taxon]: ({ nodeDef, options }) => {
    const { includeTaxonScientificName = false } = options ?? {}
    const nodeDefName = NodeDefs.getName(nodeDef)
    return [
      {
        header: nodeDefName,
        nodeDef,
        dataType: FlatDataExportColumnDataType.text,
        valueProp: NodeValues.ValuePropsTaxon.code,
      },
      ...(includeTaxonScientificName
        ? [
            {
              header: `${nodeDefName}_scientific_name`,
              nodeDef,
              dataType: FlatDataExportColumnDataType.text,
              valueProp: NodeValues.ValuePropsTaxon.scientificName,
            },
            {
              header: `${nodeDefName}_vernacular_name`,
              nodeDef,
              dataType: FlatDataExportColumnDataType.text,
              valueProp: NodeValues.ValuePropsTaxon.vernacularName,
            },
          ]
        : []),
    ]
  },
  [NodeDefType.text]: ({ nodeDef }) => [getMainColumn({ nodeDef, dataType: FlatDataExportColumnDataType.text })],
  [NodeDefType.time]: ({ nodeDef }) => [getMainColumn({ nodeDef, dataType: FlatDataExportColumnDataType.text })],
}

const RECORD_CYCLE_HEADER = 'record_cycle'

export class FlatDataExportModel {
  survey: Survey
  cycle: string
  nodeDefContext: NodeDef<any>
  options: DataExportOptions
  columns: Column[]

  static columnDataType: typeof FlatDataExportColumnDataType = FlatDataExportColumnDataType
  static getExpandedCategoryItemColumnHeader: typeof getExpandedCategoryItemColumnHeader =
    getExpandedCategoryItemColumnHeader

  constructor({
    survey,
    cycle,
    nodeDefContext,
    options = DataExportDefaultOptions,
  }: {
    survey: Survey
    cycle: string
    nodeDefContext: NodeDef<any>
    options?: DataExportOptions
  }) {
    this.survey = survey
    this.cycle = cycle
    this.nodeDefContext = nodeDefContext
    this.options = { ...DataExportDefaultOptions, ...options }
    this.columns = []

    this.init()
  }

  init() {
    this._initColumns()
  }

  _initColumns() {
    const { addCycle } = this.options

    const ancestorsColumns = this.extractAncestorsColumns()

    const contextNodeDefsColumns = this.extractContextNodeDefsColumns()

    this.columns = [
      ...(addCycle ? [{ header: RECORD_CYCLE_HEADER }] : []),
      ...ancestorsColumns,
      ...contextNodeDefsColumns,
    ]
  }

  _createColumnsFromAttributeDefs(attributeDefs: NodeDef<any>[]) {
    const { survey, options } = this
    const result = []
    for (const nodeDef of attributeDefs) {
      const columnsGetter = columnsExtractorByNodeDefType[NodeDefs.getType(nodeDef)]

      const columnsPerAttribute = columnsGetter ? columnsGetter({ survey, nodeDef, options }) : []

      if (NodeDefs.isKey(nodeDef)) {
        for (const col of columnsPerAttribute) {
          col.key = true
        }
      }
      result.push(...columnsPerAttribute)
    }
    return result
  }

  protected extractAncestorsColumns(): Column[] {
    const { survey, cycle, nodeDefContext, options } = this
    const { includeAncestorAttributes } = options

    const ancestorsColumns: Column[] = []

    Surveys.visitAncestorsAndSelfNodeDef({
      survey,
      nodeDef: nodeDefContext,
      visitor: (nodeDefAncestor) => {
        const ancestorAttributeDefs = includeAncestorAttributes
          ? // include all ancestor attributes
            this.extractAncestorAttributeDefs(nodeDefAncestor)
          : // consider only ancestor key attributes
            Surveys.getNodeDefKeys({ survey, cycle, nodeDef: nodeDefAncestor })
        const ancestorColumns = this._createColumnsFromAttributeDefs(ancestorAttributeDefs)
        ancestorsColumns.unshift(...ancestorColumns)
      },
      includeSelf: false,
    })

    return ancestorsColumns
  }

  extractAncestorAttributeDefs(nodeDefContext: NodeDef<any>): NodeDef<any>[] {
    const { cycle, options, survey } = this
    const { includeAnalysis, includeFileAttributeDefs, includeFiles, includeReadOnlyAttributes } = options

    let result = NodeDefs.isEntity(nodeDefContext)
      ? Surveys.getDescendantsInSingleEntities({
          survey,
          cycle,
          nodeDef: nodeDefContext,
          predicate: (visitedNodeDef) =>
            visitedNodeDef !== nodeDefContext && (!NodeDefs.isAnalysis(visitedNodeDef) || !!includeAnalysis),
        })
      : [nodeDefContext] // Multiple attribute

    result = result.filter(
      (nodeDef) =>
        (includeFileAttributeDefs || includeFiles || NodeDefs.getType(nodeDef) !== NodeDefType.file) &&
        (includeReadOnlyAttributes || !NodeDefs.isReadOnly(nodeDef) || NodeDefs.isKey(nodeDef))
    )
    return result
  }

  protected extractContextNodeDefsColumns(): Column[] {
    const descendantDefs = this.extractAncestorAttributeDefs(this.nodeDefContext)
    return this._createColumnsFromAttributeDefs(descendantDefs)
  }

  get headers() {
    return this.columns.map((column) => column.header)
  }

  getColumnByHeader(header: string): Column | undefined {
    return this.columns.find((column) => column.header === header)
  }
}
