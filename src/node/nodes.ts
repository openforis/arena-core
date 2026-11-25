import { ArenaDictionary } from '../common'
import { ArenaNodeDef, NodeDefCountType, NodeDefs } from '../nodeDef'
import { Dates, Objects } from '../utils'
import { ArenaMutationOptions } from '../utils/mutationOptions'
import { ArenaRecordNode } from './node'

/**
 * Options of the node update functions.
 */
export interface ArenaRecordNodeUpdateOptions extends ArenaMutationOptions {
  /**
   * Date of the modification (formatted for storage); the same date is used for all the nodes modified in the same record update.
   * @default now
   */
  dateModified?: string
}

const getDateModified = (options?: ArenaRecordNodeUpdateOptions): string =>
  options?.dateModified ?? Dates.nowFormattedForStorage()

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
  nodeDef: ArenaNodeDef<any>
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
  // count expressions (array) are evaluated into the parent node meta (childrenMinCount/childrenMaxCount)
  return nodeDefCount && !Array.isArray(nodeDefCount) ? Number(nodeDefCount) : Number.NaN
}

const getChildrenMaxCount = (params: { parentNode: ArenaRecordNode; nodeDef: ArenaNodeDef<any> }): number =>
  getChildrenMinOrMaxCount({ ...params, countType: NodeDefCountType.max })

const getChildrenMinCount = (params: { parentNode: ArenaRecordNode; nodeDef: ArenaNodeDef<any> }): number =>
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

const assocChildApplicability = (
  node: ArenaRecordNode,
  nodeDefUuid: string,
  applicable: boolean,
  options?: Omit<ArenaRecordNodeUpdateOptions, 'sideEffect'>
): ArenaRecordNode => {
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
    dateModified: getDateModified(options),
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
  dateModified,
}: {
  node: ArenaRecordNode
  nodeDefUuid: string
  propName: MetaBooleanDictionaryProp
  propValue: boolean
  defaultValue?: boolean
  sideEffect: boolean
  dateModified?: string
}): ArenaRecordNode => {
  const nodeUpdated = sideEffect ? node : { ...node }
  const metaOriginal = nodeUpdated.meta ?? {}
  const meta = sideEffect ? metaOriginal : { ...metaOriginal }
  const existingDictionary: ArenaDictionary<boolean> = meta[propName] ?? {}
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
  nodeUpdated.dateModified = getDateModified({ dateModified })
  return nodeUpdated
}

function assocChildEditable(
  node: ArenaRecordNode,
  nodeDefUuid: string,
  editable: boolean,
  options?: ArenaRecordNodeUpdateOptions
): ArenaRecordNode {
  const { sideEffect = false, dateModified } = options ?? {}
  return updateMetaDictionary({ node, nodeDefUuid, propName: 'cEdit', propValue: editable, sideEffect, dateModified })
}

const assocChildRequired = (
  node: ArenaRecordNode,
  nodeDefUuid: string,
  required: boolean,
  options?: ArenaRecordNodeUpdateOptions
): ArenaRecordNode => {
  const { sideEffect = false, dateModified } = options ?? {}
  return updateMetaDictionary({
    node,
    nodeDefUuid,
    propName: 'cReq',
    propValue: required,
    defaultValue: false,
    sideEffect,
    dateModified,
  })
}

function assocChildVisible(
  node: ArenaRecordNode,
  nodeDefUuid: string,
  visible: boolean,
  options?: ArenaRecordNodeUpdateOptions
): ArenaRecordNode {
  const { sideEffect = false, dateModified } = options ?? {}
  return updateMetaDictionary({ node, nodeDefUuid, propName: 'cVis', propValue: visible, sideEffect, dateModified })
}

const assocChildrenCount = (params: {
  node: ArenaRecordNode
  nodeDefUuid: string
  count: number
  countType: NodeDefCountType
  dateModified?: string
}): ArenaRecordNode => {
  const { node, nodeDefUuid, count, countType, dateModified } = params
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
    dateModified: getDateModified({ dateModified }),
  }
}

const assocChildrenMaxCount = (params: {
  node: ArenaRecordNode
  nodeDefUuid: string
  count: number
  dateModified?: string
}): ArenaRecordNode => assocChildrenCount({ ...params, countType: NodeDefCountType.max })

const assocChildrenMinCount = (params: {
  node: ArenaRecordNode
  nodeDefUuid: string
  count: number
  dateModified?: string
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

function assocValue(node: ArenaRecordNode, value: any, options?: ArenaRecordNodeUpdateOptions): ArenaRecordNode {
  const { sideEffect = false } = options ?? {}
  const nodeUpdated = sideEffect ? node : { ...node }
  nodeUpdated.value = value
  nodeUpdated.updated = true
  nodeUpdated.dateModified = getDateModified(options)
  if (isDefaultValueApplied(nodeUpdated) || isQualifierValueApplied(nodeUpdated)) {
    // reset defaultValueApplied and qualifierValueApplied flags
    const metaOriginal = nodeUpdated.meta ?? {}
    const meta = sideEffect ? metaOriginal : { ...metaOriginal }
    nodeUpdated.meta = { ...meta, defaultValueApplied: false, qualifierValueApplied: false }
  }
  return nodeUpdated
}

export const RecordNodes = {
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
