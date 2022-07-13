import { AuthGroup } from '../auth'
import { SystemError } from '../error'
import {
  NodeDefBooleanProps,
  NodeDefCodeProps,
  NodeDefDecimalProps,
  NodeDefFileProps,
  NodeDefMeta,
  NodeDefProps,
  NodeDefPropsAdvanced,
  NodeDefTaxonProps,
  NodeDefTextProps,
  NodeDefType,
} from '../nodeDef'
import { Survey, SurveyProps } from './survey'

export abstract class ArenaObj<P> {
  uuid: string
  id?: number
  props?: P

  constructor(uuid: string) {
    this.uuid = uuid
  }
}

export abstract class NodeDefObj<P extends NodeDefProps = NodeDefProps> extends ArenaObj<P> {
  protected _survey: SurveyObj
  protected _parent?: EntityDefObj

  analysis?: boolean
  dateCreated?: string
  dateModified?: string
  deleted?: boolean
  draft?: boolean
  meta?: NodeDefMeta
  propsAdvanced?: NodeDefPropsAdvanced
  propsAdvancedDraft?: NodeDefPropsAdvanced
  propsDraft?: P
  published?: boolean
  temporary?: boolean
  virtual?: boolean

  constructor(survey: SurveyObj, uuid: string, parent?: EntityDefObj) {
    super(uuid)
    this._survey = survey
    this._parent = parent

    parent?.addChild(this)
  }

  get survey(): SurveyObj {
    return this._survey
  }

  get parent(): EntityDefObj | undefined {
    return this._parent
  }

  get parentUuid(): string | undefined {
    return this._parent?.uuid
  }

  abstract get type(): NodeDefType
}

export class BooleanNodeDefObj extends NodeDefObj<NodeDefBooleanProps> {
  constructor(survey: SurveyObj, uuid: string, parent?: EntityDefObj) {
    super(survey, uuid, parent)
  }
  get type(): NodeDefType {
    return NodeDefType.boolean
  }
}

export class CodeNodeDefObj extends NodeDefObj<NodeDefCodeProps> {
  constructor(survey: SurveyObj, uuid: string, parent?: EntityDefObj) {
    super(survey, uuid, parent)
  }
  get type(): NodeDefType {
    return NodeDefType.code
  }
}

export class CoordinateNodeDefObj extends NodeDefObj<NodeDefProps> {
  constructor(survey: SurveyObj, uuid: string, parent?: EntityDefObj) {
    super(survey, uuid, parent)
  }
  get type(): NodeDefType {
    return NodeDefType.coordinate
  }
}

export class DateNodeDefObj extends NodeDefObj<NodeDefProps> {
  constructor(survey: SurveyObj, uuid: string, parent?: EntityDefObj) {
    super(survey, uuid, parent)
  }
  get type(): NodeDefType {
    return NodeDefType.date
  }
}

export class DecimalNodeDefObj extends NodeDefObj<NodeDefDecimalProps> {
  constructor(survey: SurveyObj, uuid: string, parent?: EntityDefObj) {
    super(survey, uuid, parent)
  }
  get type(): NodeDefType {
    return NodeDefType.decimal
  }
}

export class EntityDefObj extends NodeDefObj<NodeDefProps> {
  protected _children: NodeDefObj<any>[] = []

  constructor(survey: SurveyObj, uuid: string, parent?: EntityDefObj) {
    super(survey, uuid, parent)
  }

  getChildren(params: { includeAnalysis: boolean } = { includeAnalysis: false }): NodeDefObj<any>[] {
    const { includeAnalysis = false } = params
    return includeAnalysis ? this._children : this._children.filter((child) => !child.analysis)
  }

  addChild(childDef: NodeDefObj<any>) {
    this._children.push(childDef)
  }
  get type(): NodeDefType {
    return NodeDefType.entity
  }
}

export class FileNodeDefObj extends NodeDefObj<NodeDefFileProps> {
  constructor(survey: SurveyObj, uuid: string, parent?: EntityDefObj) {
    super(survey, uuid, parent)
  }
  get type(): NodeDefType {
    return NodeDefType.file
  }
}

export class IntegerNodeDefObj extends NodeDefObj<NodeDefProps> {
  constructor(survey: SurveyObj, uuid: string, parent?: EntityDefObj) {
    super(survey, uuid, parent)
  }
  get type(): NodeDefType {
    return NodeDefType.integer
  }
}
export class TaxonNodeDefObj extends NodeDefObj<NodeDefTaxonProps> {
  constructor(survey: SurveyObj, uuid: string, parent?: EntityDefObj) {
    super(survey, uuid, parent)
  }
  get type(): NodeDefType {
    return NodeDefType.taxon
  }
}
export class TextNodeDefObj extends NodeDefObj<NodeDefTextProps> {
  constructor(survey: SurveyObj, uuid: string, parent?: EntityDefObj) {
    super(survey, uuid, parent)
  }
  get type(): NodeDefType {
    return NodeDefType.text
  }
}
export class TimeNodeDefObj extends NodeDefObj<NodeDefProps> {
  constructor(survey: SurveyObj, uuid: string, parent?: EntityDefObj) {
    super(survey, uuid, parent)
  }
  get type(): NodeDefType {
    return NodeDefType.time
  }
}

const nodeDefConstructorByType = {
  [NodeDefType.boolean]: BooleanNodeDefObj,
  [NodeDefType.code]: CodeNodeDefObj,
  [NodeDefType.coordinate]: CoordinateNodeDefObj,
  [NodeDefType.date]: DateNodeDefObj,
  [NodeDefType.decimal]: DecimalNodeDefObj,
  [NodeDefType.entity]: EntityDefObj,
  [NodeDefType.file]: FileNodeDefObj,
  [NodeDefType.integer]: IntegerNodeDefObj,
  [NodeDefType.taxon]: TaxonNodeDefObj,
  [NodeDefType.text]: TextNodeDefObj,
  [NodeDefType.time]: TimeNodeDefObj,
}

export class SurveyObj extends ArenaObj<SurveyProps> {
  authGroups: AuthGroup[] = []
  props: SurveyProps
  draft = false
  ownerUuid = ''
  published = false
  template = false
  nodeDefs: { [key: string]: NodeDefObj<any> }
  protected _rootDef?: EntityDefObj

  constructor(s: Survey) {
    super(s.uuid)
    this.props = s.props
    // assign properties from json object and ignore some of them
    const { nodeDefs: _nodeDefs, ...surveyOtherProps } = s
    Object.assign(this, surveyOtherProps)
    this.nodeDefs = {}

    Object.values(s.nodeDefs || {})
      // .sort((nodeDef1: NodeDef<any>, nodeDef2: NodeDef<any>) => (nodeDef1.id || 0) - (nodeDef2.id || 0))
      .forEach((nodeDef) => {
        let parentEntityObj: EntityDefObj | undefined
        if (nodeDef.parentUuid) {
          parentEntityObj = this.nodeDefs[nodeDef.parentUuid] as EntityDefObj
          if (!parentEntityObj) {
            throw new SystemError('systemError.survey.nodeDef.parentNotFound', { parentUuid: nodeDef.parentUuid })
          }
        }
        const constructorFn = nodeDefConstructorByType[nodeDef.type]
        const nodeDefObj = new constructorFn(this, nodeDef.uuid, parentEntityObj)
        // assign properties from json object and ignore some of them
        const { parentUuid: _parentUuid, type: _type, ...nodeDefOtherProps } = nodeDef
        Object.assign(nodeDefObj, nodeDefOtherProps)

        this.nodeDefs[nodeDef.uuid] = nodeDefObj

        if (!parentEntityObj) {
          this._rootDef = nodeDefObj as EntityDefObj
        }
      })
  }

  get root(): EntityDefObj {
    if (!this._rootDef) throw new SystemError('systemError.survey.rootNotDefined')
    return this._rootDef
  }

  getNodeDefByUuid(uuid: string): NodeDefObj | undefined {
    return this.nodeDefs[uuid]
  }

  getNodeDefByName(name: string): NodeDefObj | undefined {
    return Object.values(this.nodeDefs).find((nodeDef) => nodeDef.props.name === name)
  }
}
