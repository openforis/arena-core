import { Objects, UUIDs } from '../utils'
import { ArenaObject, Factory } from '../common'
import { Labels } from '../language'
import { ValidationSeverity } from '../validation'

export enum NodeDefType {
  boolean = 'boolean',
  code = 'code',
  coordinate = 'coordinate',
  date = 'date',
  decimal = 'decimal',
  geo = 'geo',
  entity = 'entity',
  file = 'file',
  integer = 'integer',
  taxon = 'taxon',
  text = 'text',
  time = 'time',
  // layout elements
  formHeader = 'formHeader',
}

export enum NodeDefCountType {
  max = 'max',
  min = 'min',
}

export interface NodeDefMeta {
  h: Array<string>
}

export interface NodeDefProps {
  cycles?: Array<string>
  descriptions?: Labels
  key?: boolean
  autoIncrementalKey?: boolean
  labels?: Labels
  multiple?: boolean
  name?: string
  readOnly?: boolean

  // available only when readOnly is true
  hidden?: boolean

  visibleFields?: string[]
}

export interface NodeDefLayout {
  hiddenWhenNotRelevant?: boolean
  hiddenInMobile?: boolean
  includedInMultipleEntitySummary?: boolean
  // code
  codeShown?: boolean
}

export interface NodeDefPropsWithLayout<L extends NodeDefLayout> extends NodeDefProps {
  layout?: {
    [cycleKey: string]: L
  }
}

export interface NodeDefExpression {
  applyIf?: string
  expression?: string
  messages?: Labels
  severity?: ValidationSeverity
  uuid: string
}

export interface NodeDefExpressionFactoryParams {
  applyIf?: string
  expression: string
  severity?: ValidationSeverity
}

export const NodeDefExpressionFactory: Factory<NodeDefExpression, NodeDefExpressionFactoryParams> = {
  createInstance: (params: NodeDefExpressionFactoryParams): NodeDefExpression => {
    const result = { uuid: UUIDs.v4() }
    Object.assign(result, Objects.deleteEmptyProps({ ...params }))
    return result
  },
}

export interface NodeDefCountValidations {
  max?: string | NodeDefExpression[]
  min?: string | NodeDefExpression[]
}

export interface NodeDefValidations {
  count?: NodeDefCountValidations
  expressions?: Array<NodeDefExpression>
  required?: boolean
  unique?: boolean
}

export interface NodeDefPropsAdvanced {
  applicable?: NodeDefExpression[]
  defaultValues?: NodeDefExpression[]
  defaultValueEvaluatedOneTime?: boolean
  excludedInClone?: boolean
  formula?: NodeDefExpression[]
  validations?: NodeDefValidations
  // file attribute
  fileNameExpression?: string
  // code and taxon attribute
  itemsFilter?: string

  // Analysis
  script?: string
  chainUuid?: string
  index?: number
  active?: boolean
  aggregateFunctions?: { [key: string]: object }

  isBaseUnit?: boolean
  isSampling?: boolean
  hasAreaBasedEstimated?: boolean
  areaBasedEstimatedOf?: string // uuid of area based estimated node def
}

export interface NodeDef<T extends NodeDefType, P extends NodeDefProps = NodeDefProps> extends ArenaObject<P> {
  analysis?: boolean
  dateCreated?: string
  dateModified?: string
  deleted?: boolean
  draft?: boolean
  id?: number
  meta: NodeDefMeta
  parentUuid?: string
  propsAdvanced?: NodeDefPropsAdvanced
  propsAdvancedDraft?: NodeDefPropsAdvanced
  propsDraft?: P
  published?: boolean
  temporary?: boolean
  type: T
  virtual?: boolean
}

export interface NodeDefMap {
  [key: string]: NodeDef<any>
}
