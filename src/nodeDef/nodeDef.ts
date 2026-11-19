import { Objects, UUIDs } from '../utils'
import { ArenaObject, ArenaFactory } from '../common'
import { ArenaLabels } from '../language'
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

export interface ArenaNodeDefMeta {
  h: string[]
}

export interface ArenaNodeDefProps {
  cycles?: string[]
  descriptions?: ArenaLabels
  key?: boolean
  autoIncrementalKey?: boolean
  labels?: ArenaLabels
  multiple?: boolean
  name?: string
  qualifier?: boolean
  readOnly?: boolean

  // available only when readOnly is true
  hidden?: boolean

  visibleFields?: string[]
}

export interface ArenaNodeDefLayout {
  hiddenWhenNotRelevant?: boolean
  hiddenInMobile?: boolean
  includedInMultipleEntitySummary?: boolean
  includedInPreviousCycleLink?: boolean
  // code
  codeShown?: boolean
}

export interface ArenaNodeDefPropsWithLayout<L extends ArenaNodeDefLayout> extends ArenaNodeDefProps {
  layout?: {
    [cycleKey: string]: L
  }
}

export interface ArenaNodeDefExpression {
  applyIf?: string
  expression?: string
  messages?: ArenaLabels
  severity?: ValidationSeverity
  uuid: string
}

export interface ArenaNodeDefExpressionFactoryParams {
  applyIf?: string
  expression?: string
  messages?: ArenaLabels
  severity?: ValidationSeverity
}

export const NodeDefExpressionFactory: ArenaFactory<ArenaNodeDefExpression, ArenaNodeDefExpressionFactoryParams> = {
  createInstance: (params: ArenaNodeDefExpressionFactoryParams): ArenaNodeDefExpression => {
    const result = { uuid: UUIDs.v4() }
    Object.assign(result, Objects.deleteEmptyProps({ ...params }))
    return result
  },
}

export type ArenaNodeDefCountExpression = string | ArenaNodeDefExpression[]

export interface NodeDefCountValidations {
  max?: ArenaNodeDefCountExpression
  min?: ArenaNodeDefCountExpression
}

export interface ArenaNodeDefValidations {
  count?: NodeDefCountValidations
  expressions?: ArenaNodeDefExpression[]
  required?: boolean
  /**
   * Conditions making a single attribute required (alternative to `required`, which makes it always required).
   */
  requiredIf?: ArenaNodeDefExpression[]
  unique?: boolean
}

export interface ArenaNodeDefPropsAdvanced {
  applicable?: ArenaNodeDefExpression[]
  defaultValues?: ArenaNodeDefExpression[]
  defaultValueEvaluatedOneTime?: boolean
  editableIf?: ArenaNodeDefExpression[]
  excludedInClone?: boolean
  formula?: ArenaNodeDefExpression[]
  validations?: ArenaNodeDefValidations
  visibleIf?: ArenaNodeDefExpression[]
  // file attribute
  fileNameExpression?: string
  // enumerate entity
  enumeratingItemsExpression?: string
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

export interface ArenaNodeDef<
  T extends NodeDefType,
  P extends ArenaNodeDefProps = ArenaNodeDefProps,
> extends ArenaObject<P> {
  analysis?: boolean
  dateCreated?: string
  dateModified?: string
  deleted?: boolean
  draft?: boolean
  id?: number
  meta: ArenaNodeDefMeta
  parentUuid?: string
  propsAdvanced?: ArenaNodeDefPropsAdvanced
  propsAdvancedDraft?: ArenaNodeDefPropsAdvanced
  published?: boolean
  temporary?: boolean
  type: T
  virtual?: boolean
}

/** Node definition of any type. */
export type ArenaAnyNodeDef = ArenaNodeDef<NodeDefType>

export interface ArenaNodeDefMap {
  [key: string]: ArenaNodeDef<any>
}
