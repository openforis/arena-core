import { UUIDs } from '../utils'
import { ArenaObject, Factory } from '../common'
import { Labels } from '../language'
import { ValidationSeverity } from '../validation'

export enum NodeDefType {
  boolean = 'boolean',
  code = 'code',
  coordinate = 'coordinate',
  date = 'date',
  decimal = 'decimal',
  entity = 'entity',
  file = 'file',
  integer = 'integer',
  taxon = 'taxon',
  text = 'text',
  time = 'time',
}

export interface NodeDefMeta {
  h: Array<string>
}

export interface NodeDefProps {
  cycles?: Array<string>
  key?: boolean
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
  expression?: string
}

export const NodeDefExpressionFactory: Factory<NodeDefExpression, NodeDefExpressionFactoryParams> = {
  createInstance: (params: NodeDefExpressionFactoryParams): NodeDefExpression => {
    const { applyIf, expression } = params
    return { applyIf, expression, uuid: UUIDs.v4() }
  },
}

export interface NodeDefCountValidations {
  max?: number
  min?: number
}

export interface NodeDefValidations {
  count?: NodeDefCountValidations
  expressions?: Array<NodeDefExpression>
  required?: boolean
  unique?: boolean
}

export interface NodeDefPropsAdvanced {
  applicable?: Array<NodeDefExpression>
  defaultValues?: Array<NodeDefExpression>
  defaultValueEvaluatedOneTime?: boolean
  formula?: Array<NodeDefExpression>
  validations?: NodeDefValidations
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
