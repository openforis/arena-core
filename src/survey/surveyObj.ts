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

  abstract get type(): NodeDefType

  get survey(): SurveyObj {
    return this._survey
  }

  get name(): string {
    return this.props?.name || ''
  }

  get parent(): EntityDefObj | undefined {
    return this._parent
  }

  get parentUuid(): string | undefined {
    return this._parent?.uuid
  }

  isAncestorOf(nodeDefDescendant: NodeDefObj): boolean {
    let currentDescendant: NodeDefObj | undefined = nodeDefDescendant
    while (currentDescendant) {
      if (currentDescendant === this) return true
      currentDescendant = currentDescendant.parent
    }
    return false
  }

  isDescendantOf(nodeDefAncestor: NodeDefObj): boolean {
    return nodeDefAncestor.isAncestorOf(this)
  }
}

export abstract class AttributeDefObj<P extends NodeDefProps = NodeDefProps> extends NodeDefObj<P> {
  get key(): boolean {
    return this.props?.key || false
  }
}

export class BooleanNodeDefObj extends AttributeDefObj<NodeDefBooleanProps> {
  constructor(survey: SurveyObj, uuid: string, parent?: EntityDefObj) {
    super(survey, uuid, parent)
  }
  get type(): NodeDefType {
    return NodeDefType.boolean
  }
}

export class CodeNodeDefObj extends AttributeDefObj<NodeDefCodeProps> {
  constructor(survey: SurveyObj, uuid: string, parent?: EntityDefObj) {
    super(survey, uuid, parent)
  }
  get type(): NodeDefType {
    return NodeDefType.code
  }

  get parentCode(): CodeNodeDefObj | undefined {
    const parentCodeDefUuid = this.props?.parentCodeDefUuid
    if (!parentCodeDefUuid) return undefined
    const parentCodeDef = this.survey.getNodeDefByUuid(parentCodeDefUuid)
    return parentCodeDef ? (parentCodeDef as CodeNodeDefObj) : undefined
  }

  isParentCode(): boolean {
    return Object.values(this.survey.nodeDefs).some(
      (nodeDef) =>
        nodeDef instanceof CodeNodeDefObj && (nodeDef as CodeNodeDefObj).props?.parentCodeDefUuid === this.uuid
    )
  }

  get categoryLevelIndex(): number {
    const parentC = this.parentCode
    return parentC ? 1 + parentC.categoryLevelIndex : 0
  }
}

export class CoordinateNodeDefObj extends AttributeDefObj<NodeDefProps> {
  constructor(survey: SurveyObj, uuid: string, parent?: EntityDefObj) {
    super(survey, uuid, parent)
  }
  get type(): NodeDefType {
    return NodeDefType.coordinate
  }
}

export class DateNodeDefObj extends AttributeDefObj<NodeDefProps> {
  constructor(survey: SurveyObj, uuid: string, parent?: EntityDefObj) {
    super(survey, uuid, parent)
  }
  get type(): NodeDefType {
    return NodeDefType.date
  }
}

export class DecimalNodeDefObj extends AttributeDefObj<NodeDefDecimalProps> {
  constructor(survey: SurveyObj, uuid: string, parent?: EntityDefObj) {
    super(survey, uuid, parent)
  }
  get type(): NodeDefType {
    return NodeDefType.decimal
  }
}

export class FileNodeDefObj extends AttributeDefObj<NodeDefFileProps> {
  constructor(survey: SurveyObj, uuid: string, parent?: EntityDefObj) {
    super(survey, uuid, parent)
  }
  get type(): NodeDefType {
    return NodeDefType.file
  }
}

export class IntegerNodeDefObj extends AttributeDefObj<NodeDefProps> {
  constructor(survey: SurveyObj, uuid: string, parent?: EntityDefObj) {
    super(survey, uuid, parent)
  }
  get type(): NodeDefType {
    return NodeDefType.integer
  }
}
export class TaxonNodeDefObj extends AttributeDefObj<NodeDefTaxonProps> {
  constructor(survey: SurveyObj, uuid: string, parent?: EntityDefObj) {
    super(survey, uuid, parent)
  }
  get type(): NodeDefType {
    return NodeDefType.taxon
  }
}
export class TextNodeDefObj extends AttributeDefObj<NodeDefTextProps> {
  constructor(survey: SurveyObj, uuid: string, parent?: EntityDefObj) {
    super(survey, uuid, parent)
  }
  get type(): NodeDefType {
    return NodeDefType.text
  }
}
export class TimeNodeDefObj extends AttributeDefObj<NodeDefProps> {
  constructor(survey: SurveyObj, uuid: string, parent?: EntityDefObj) {
    super(survey, uuid, parent)
  }
  get type(): NodeDefType {
    return NodeDefType.time
  }
}

export class EntityDefObj extends NodeDefObj<NodeDefProps> {
  protected _children: NodeDefObj<any>[] = []

  constructor(survey: SurveyObj, uuid: string, parent?: EntityDefObj) {
    super(survey, uuid, parent)
  }

  get type(): NodeDefType {
    return NodeDefType.entity
  }

  getChildren(params: { includeAnalysis: boolean } = { includeAnalysis: false }): NodeDefObj<any>[] {
    const { includeAnalysis = false } = params
    return includeAnalysis ? this._children : this._children.filter((child) => !child.analysis)
  }

  addChild(childDef: NodeDefObj<any>) {
    this._children.push(childDef)
  }

  get keyAttributeDefs(): AttributeDefObj[] {
    const children = this.getChildren()
    return children.filter(
      (childDef) => childDef instanceof AttributeDefObj && (childDef as AttributeDefObj).key && !childDef.deleted
    ) as AttributeDefObj[]
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

  getNodeDefsByUuids(uuids: string[]): (NodeDefObj | undefined)[] {
    return uuids.map((uuid) => this.getNodeDefByUuid(uuid))
  }

  getNodeDefByName(name: string): NodeDefObj | undefined {
    return Object.values(this.nodeDefs).find((nodeDef) => nodeDef.props.name === name)
  }
}
