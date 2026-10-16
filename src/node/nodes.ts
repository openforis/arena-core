import { Dictionary } from '../common'
import { NodeDef, NodeDefCountType, NodeDefs } from '../nodeDef'
import { Dates, Objects } from '../utils'
import { MutationOptions, toMutationOptions } from '../utils/mutationOptions'
import { ArenaRecordNode } from './node'

const isRoot = (node: ArenaRecordNode): boolean => !node.parentUuid

const areEqual = (nodeA: ArenaRecordNode, nodeB: ArenaRecordNode): boolean => nodeA.uuid === nodeB.uuid

const isChildApplicable = (node: ArenaRecordNode, nodeDefUuid: string): boolean => {
  // if child applicability is not defined for a node definition, consider it applicable
  return node.meta?.childApplicability?.[nodeDefUuid] !== false
}

const isChildEditable = (node: ArenaRecordNode, nodeDefUuid: string): boolean => {
  // if child editability is not defined for a node definition, consider it editable
  return node.meta?.cEdit?.[nodeDefUuid] !== false
}

const isChildVisible = (node: ArenaRecordNode, nodeDefUuid: string): boolean => {
  // if child visibility is not defined for a node definition, consider it visible
  return node.meta?.cVis?.[nodeDefUuid] !== false
}

const isChildRequired = (node: ArenaRecordNode, nodeDefUuid: string): boolean => {
  // if child "required if" condition is not defined or not met for a node definition, consider it not required
  return node.meta?.cReq?.[nodeDefUuid] === true
}

const getChildrenMinOrMaxCount = (params: {
  parentNode: ArenaRecordNode
  nodeDef: NodeDef<any>
  countType: NodeDefCountType
}): number => {
  const { parentNode, nodeDef, countType } = params
  const countIndex =
    countType === NodeDefCountType.max ? parentNode.meta?.childrenMaxCount : parentNode.meta?.childrenMinCount

  const count = countIndex?.[nodeDef.uuid]
  if (!Objects.isEmpty(count)) return count!

  // count can be a constant value, specified in the node def min/max count prop
  const nodeDefCount =
    countType === NodeDefCountType.max ? NodeDefs.getMaxCount(nodeDef) : NodeDefs.getMinCount(nodeDef)
  return nodeDefCount ? Number(nodeDefCount) : Number.NaN
}

const getChildrenMaxCount = (params: { parentNode: ArenaRecordNode; nodeDef: NodeDef<any> }): number =>
  getChildrenMinOrMaxCount({ ...params, countType: NodeDefCountType.max })

const getChildrenMinCount = (params: { parentNode: ArenaRecordNode; nodeDef: NodeDef<any> }): number =>
  getChildrenMinOrMaxCount({ ...params, countType: NodeDefCountType.min })

const getHierarchy = (node: ArenaRecordNode): string[] => [...(node.meta?.h ?? [])]

const getHierarchyCode = (node: ArenaRecordNode): string[] => [...(node.meta?.hCode ?? [])]

const mergeNodes = (target: ArenaRecordNode, ...sources: ArenaRecordNode[] | object[]): ArenaRecordNode =>
  Objects.deepMerge(target, ...sources) as unknown as ArenaRecordNode

const isDefaultValueApplied = (node: ArenaRecordNode): boolean => node?.meta?.defaultValueApplied ?? false

const isQualifierValueApplied = (node: ArenaRecordNode): boolean => node?.meta?.qualifierValueApplied ?? false

const isValueBlank = (node: ArenaRecordNode): boolean => Objects.isEmpty(node.value)

const isValueNotBlank = (node: ArenaRecordNode): boolean => Objects.isNotEmpty(node.value)

const hasUserInputValue = (node: ArenaRecordNode): boolean =>
  node && !isValueBlank(node) && !isDefaultValueApplied(node) && !isQualifierValueApplied(node)

const assocChildApplicability = (node: ArenaRecordNode, nodeDefUuid: string, applicable: boolean): ArenaRecordNode => {
  const childApplicability = { ...node.meta?.childApplicability }
  if (!applicable) {
    childApplicability[nodeDefUuid] = applicable
  } else {
    delete childApplicability[nodeDefUuid]
  }
  return {
    ...node,
    meta: { ...node.meta, childApplicability },
    updated: true,
    dateModified: Dates.nowFormattedForStorage(),
  }
}

const dissocChildApplicability = (node: ArenaRecordNode, nodeDefUuid: string) => {
  const childApplicability = { ...node.meta?.childApplicability }
  delete childApplicability[nodeDefUuid]
  return {
    ...node,
    meta: { ...node.meta, childApplicability },
  }
}

type MetaBooleanDictionaryProp = 'childApplicability' | 'cEdit' | 'cVis' | 'cReq'

const updateMetaDictionary = ({
  node,
  nodeDefUuid,
  propName,
  propValue,
  defaultValue = true,
  sideEffect,
}: {
  node: ArenaRecordNode
  nodeDefUuid: string
  propName: MetaBooleanDictionaryProp
  propValue: boolean
  defaultValue?: boolean
  sideEffect: boolean
}): ArenaRecordNode => {
  const nodeUpdated = sideEffect ? node : { ...node }
  const metaOriginal = nodeUpdated.meta ?? {}
  const meta = sideEffect ? metaOriginal : { ...metaOriginal }
  const existingDictionary: Dictionary<boolean> = meta[propName] ?? {}
  const dictionary = sideEffect ? existingDictionary : { ...existingDictionary }
  if (propValue === defaultValue) {
    // default value: not stored
    delete dictionary[nodeDefUuid]
  } else {
    dictionary[nodeDefUuid] = propValue
  }
  meta[propName] = dictionary
  nodeUpdated.meta = meta
  nodeUpdated.updated = true
  nodeUpdated.dateModified = Dates.nowFormattedForStorage()
  return nodeUpdated
}

function assocChildEditable(
  node: ArenaRecordNode,
  nodeDefUuid: string,
  editable: boolean,
  options?: MutationOptions
): ArenaRecordNode
/** @deprecated Pass the options object instead of the positional boolean: `{ sideEffect }` */
function assocChildEditable(
  node: ArenaRecordNode,
  nodeDefUuid: string,
  editable: boolean,
  sideEffect: boolean
): ArenaRecordNode
function assocChildEditable(
  node: ArenaRecordNode,
  nodeDefUuid: string,
  editable: boolean,
  options?: MutationOptions | boolean
): ArenaRecordNode {
  const { sideEffect = false } = toMutationOptions(options)
  return updateMetaDictionary({ node, nodeDefUuid, propName: 'cEdit', propValue: editable, sideEffect })
}

const assocChildRequired = (
  node: ArenaRecordNode,
  nodeDefUuid: string,
  required: boolean,
  options?: MutationOptions
): ArenaRecordNode => {
  const { sideEffect = false } = options ?? {}
  return updateMetaDictionary({
    node,
    nodeDefUuid,
    propName: 'cReq',
    propValue: required,
    defaultValue: false,
    sideEffect,
  })
}

function assocChildVisible(
  node: ArenaRecordNode,
  nodeDefUuid: string,
  visible: boolean,
  options?: MutationOptions
): ArenaRecordNode
/** @deprecated Pass the options object instead of the positional boolean: `{ sideEffect }` */
function assocChildVisible(
  node: ArenaRecordNode,
  nodeDefUuid: string,
  visible: boolean,
  sideEffect: boolean
): ArenaRecordNode
function assocChildVisible(
  node: ArenaRecordNode,
  nodeDefUuid: string,
  visible: boolean,
  options?: MutationOptions | boolean
): ArenaRecordNode {
  const { sideEffect = false } = toMutationOptions(options)
  return updateMetaDictionary({ node, nodeDefUuid, propName: 'cVis', propValue: visible, sideEffect })
}

const assocChildrenCount = (params: {
  node: ArenaRecordNode
  nodeDefUuid: string
  count: number
  countType: NodeDefCountType
}): ArenaRecordNode => {
  const { node, nodeDefUuid, count, countType } = params
  const countIndex = {
    ...(countType === NodeDefCountType.max ? node.meta?.childrenMaxCount : node.meta?.childrenMinCount),
  }
  if (Number.isNaN(count)) {
    delete countIndex[nodeDefUuid]
  } else {
    countIndex[nodeDefUuid] = count
  }
  const metaUpdated = { ...node.meta }
  if (countType === NodeDefCountType.max) {
    metaUpdated.childrenMaxCount = countIndex
  } else {
    metaUpdated.childrenMinCount = countIndex
  }
  return {
    ...node,
    meta: metaUpdated,
    updated: true,
    dateModified: Dates.nowFormattedForStorage(),
  }
}

const assocChildrenMaxCount = (params: {
  node: ArenaRecordNode
  nodeDefUuid: string
  count: number
}): ArenaRecordNode => assocChildrenCount({ ...params, countType: NodeDefCountType.max })

const assocChildrenMinCount = (params: {
  node: ArenaRecordNode
  nodeDefUuid: string
  count: number
}): ArenaRecordNode => assocChildrenCount({ ...params, countType: NodeDefCountType.min })

const clearStatusFlagsInPlace = (node: ArenaRecordNode): ArenaRecordNode => {
  // do not use "delete": it would switch the node object to the (much bigger) V8 dictionary mode
  if (node.created !== undefined) node.created = undefined
  if (node.deleted !== undefined) node.deleted = undefined
  if (node.updated !== undefined) node.updated = undefined
  return node
}

const omitStatusFlags = (node: ArenaRecordNode): ArenaRecordNode => {
  const { created: _created, deleted: _deleted, updated: _updated, ...nodeCleaned } = node
  return nodeCleaned
}

const removeStatusFlags = ({
  node,
  sideEffect = false,
}: {
  node: ArenaRecordNode
  sideEffect?: boolean
}): ArenaRecordNode => (sideEffect ? clearStatusFlagsInPlace(node) : omitStatusFlags(node))

function assocValue(node: ArenaRecordNode, value: any, options?: MutationOptions): ArenaRecordNode
/** @deprecated Pass the options object instead of the positional boolean: `{ sideEffect }` */
function assocValue(node: ArenaRecordNode, value: any, sideEffect: boolean): ArenaRecordNode
function assocValue(node: ArenaRecordNode, value: any, options?: MutationOptions | boolean): ArenaRecordNode {
  const { sideEffect = false } = toMutationOptions(options)
  const nodeUpdated = sideEffect ? node : { ...node }
  nodeUpdated.value = value
  nodeUpdated.updated = true
  nodeUpdated.dateModified = Dates.nowFormattedForStorage()
  if (isDefaultValueApplied(nodeUpdated) || isQualifierValueApplied(nodeUpdated)) {
    // reset defaultValueApplied and qualifierValueApplied flags
    const metaOriginal = nodeUpdated.meta ?? {}
    const meta = sideEffect ? metaOriginal : { ...metaOriginal }
    nodeUpdated.meta = { ...meta, defaultValueApplied: false, qualifierValueApplied: false }
  }
  return nodeUpdated
}

export const Nodes = {
  isRoot,
  areEqual,
  isChildApplicable,
  isChildEditable,
  isChildVisible,
  isChildRequired,
  getChildrenMinOrMaxCount,
  getChildrenMaxCount,
  getChildrenMinCount,
  getHierarchy,
  getHierarchyCode,
  isDefaultValueApplied,
  isQualifierValueApplied,
  isValueBlank,
  isValueNotBlank,
  hasUserInputValue,
  // update
  assocChildApplicability,
  dissocChildApplicability,
  assocChildEditable,
  assocChildVisible,
  assocChildRequired,
  assocChildrenCount,
  assocChildrenMaxCount,
  assocChildrenMinCount,
  mergeNodes,
  removeStatusFlags,
  assocValue,
}
