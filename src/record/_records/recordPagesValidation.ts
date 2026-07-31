import { Node, Nodes } from '../../node'
import { NodeDefEntity, NodeDefs } from '../../nodeDef'
import { Survey, Surveys } from '../../survey'
import { Validations } from '../../validation'
import { Record } from '../record'
import { RecordValidations } from '../recordValidations'
import { getCycle, getNodeByUuid, getRoot } from './recordGetters'

export type PageValidationStatus = {
  hasErrors: boolean
  hasWarnings: boolean
}

export type PagesValidationProgress = {
  percent: number
  validCount: number
  totalCount: number
}

/**
 * Whether a node belongs under a page entity (itself or any descendant of that page).
 */
export const nodeBelongsToPage = (params: {
  node: Node
  pageNodeDefUuid: string
  record: Record
}): boolean => {
  const { node, pageNodeDefUuid, record } = params
  if (node.nodeDefUuid === pageNodeDefUuid) return true
  return Nodes.getHierarchy(node).some((ancestorUuid) => {
    const ancestor = getNodeByUuid(ancestorUuid)(record)
    return ancestor?.nodeDefUuid === pageNodeDefUuid
  })
}

/**
 * Whether a node belongs to this page only — not to a nested descendant page entity.
 * When descendantPageUuids is empty, all nodes under the page hierarchy are included.
 */
export const nodeBelongsToOwnPage = (params: {
  node: Node
  pageNodeDefUuid: string
  descendantPageUuids: string[]
  record: Record
}): boolean => {
  const { node, pageNodeDefUuid, descendantPageUuids, record } = params
  if (!nodeBelongsToPage({ node, pageNodeDefUuid, record })) return false
  if (descendantPageUuids.includes(node.nodeDefUuid)) return false
  return !descendantPageUuids.some((descendantUuid) =>
    nodeBelongsToPage({ node, pageNodeDefUuid: descendantUuid, record })
  )
}

/**
 * Child page-entity defs displayed in their own page under the given entity.
 */
export const getNodeDefChildrenInOwnPage = (params: {
  survey: Survey
  nodeDef: NodeDefEntity
  cycle: string
}): NodeDefEntity[] => {
  const { survey, nodeDef, cycle } = params
  return Surveys.getNodeDefChildren({ survey, nodeDef, includeAnalysis: true }).filter((child): child is NodeDefEntity => {
    if (!NodeDefs.isEntity(child)) return false
    return NodeDefs.isDisplayInOwnPage(cycle)(child as NodeDefEntity)
  })
}

/**
 * Collects all page-entity node defs in the survey cycle (root + nested own-pages).
 */
export const getPageNodeDefs = (params: { survey: Survey; cycle: string }): NodeDefEntity[] => {
  const { survey, cycle } = params
  const root = Surveys.getNodeDefRoot({ survey }) as NodeDefEntity | undefined
  if (!root) return []

  const pages: NodeDefEntity[] = []
  const stack: NodeDefEntity[] = [root]
  while (stack.length > 0) {
    const current = stack.pop()
    if (!current) continue
    pages.push(current)
    stack.push(...getNodeDefChildrenInOwnPage({ survey, nodeDef: current, cycle }))
  }
  return pages
}

/**
 * Collects descendant page node def UUIDs under a page (not including the page itself).
 */
export const getDescendantPageNodeDefUuids = (params: {
  survey: Survey
  cycle: string
  pageNodeDef: NodeDefEntity
}): string[] => {
  const { survey, cycle, pageNodeDef } = params
  const uuids: string[] = []
  const visit = (nodeDef: NodeDefEntity) => {
    const children = getNodeDefChildrenInOwnPage({ survey, nodeDef, cycle })
    for (const child of children) {
      uuids.push(child.uuid)
      visit(child)
    }
  }
  visit(pageNodeDef)
  return uuids
}

const getOwnPageFieldValidationFlags = (params: {
  nodeUuid: string
  pageNodeDefUuid: string
  descendantPageUuids: string[]
  record: Record
  recordValidation: ReturnType<typeof Validations.getValidation>
}): PageValidationStatus | null => {
  const { nodeUuid, pageNodeDefUuid, descendantPageUuids, record, recordValidation } = params

  if (RecordValidations.isValidationChildrenCountKey(nodeUuid)) {
    return getOwnPageChildrenCountValidationFlags({
      childrenCountKey: nodeUuid,
      pageNodeDefUuid,
      descendantPageUuids,
      record,
      recordValidation,
    })
  }

  const node = getNodeByUuid(nodeUuid)(record)
  if (!node || !nodeBelongsToOwnPage({ node, pageNodeDefUuid, descendantPageUuids, record })) return null

  const nodeValidation = RecordValidations.getValidationNode({ nodeUuid })(recordValidation)
  if (!nodeValidation) return null

  return {
    hasErrors: Validations.hasErrors(nodeValidation),
    hasWarnings: Validations.hasWarnings(nodeValidation),
  }
}

/**
 * Children-count validations (file min count, inline multiple min/max, etc.) are keyed as
 * `childrenCount_{parentUuid}_{childDefUuid}`, not as node UUIDs.
 * Include them when the parent is on this page, but skip counts that refer to descendant
 * page entities (missing sub-page instances should not paint the parent page red).
 */
const getOwnPageChildrenCountValidationFlags = (params: {
  childrenCountKey: string
  pageNodeDefUuid: string
  descendantPageUuids: string[]
  record: Record
  recordValidation: ReturnType<typeof Validations.getValidation>
}): PageValidationStatus | null => {
  const { childrenCountKey, pageNodeDefUuid, descendantPageUuids, record, recordValidation } = params
  const parentUuid = RecordValidations.extractValidationChildrenCountKeyParentUuid(childrenCountKey)
  const childDefUuid = RecordValidations.extractValidationChildrenCountKeyNodeDefUuid(childrenCountKey)
  if (!parentUuid || !childDefUuid) return null

  // Sub-page entity min/max counts belong to navigation of nested pages, not this page's fields.
  if (descendantPageUuids.includes(childDefUuid)) return null

  const parentNode = getNodeByUuid(parentUuid)(record)
  if (!parentNode || !nodeBelongsToOwnPage({ node: parentNode, pageNodeDefUuid, descendantPageUuids, record })) {
    return null
  }

  const fieldValidation = Validations.getFieldValidation(childrenCountKey)(recordValidation)
  if (!fieldValidation) return null

  return {
    hasErrors: Validations.hasErrors(fieldValidation),
    hasWarnings: Validations.hasWarnings(fieldValidation),
  }
}

/**
 * Aggregates error/warning flags for a page.
 * When descendantPageUuids is non-empty, nested page entities are excluded (own-page scope).
 */
export const getPageValidationStatus = (params: {
  pageNodeDefUuid: string
  descendantPageUuids?: string[]
  record: Record
}): PageValidationStatus => {
  const { pageNodeDefUuid, descendantPageUuids = [], record } = params
  const recordValidation = Validations.getValidation(record)
  const fields = Validations.getFieldValidations(recordValidation)
  let hasErrors = false
  let hasWarnings = false

  for (const nodeUuid of Object.keys(fields)) {
    const flags = getOwnPageFieldValidationFlags({
      nodeUuid,
      pageNodeDefUuid,
      descendantPageUuids,
      record,
      recordValidation,
    })
    if (!flags) continue
    if (flags.hasErrors) hasErrors = true
    if (flags.hasWarnings) hasWarnings = true
    if (hasErrors && hasWarnings) break
  }

  return { hasErrors, hasWarnings }
}

/**
 * Whether the page has validation errors on its own fields (excluding nested page entities).
 */
export const pageHasOwnErrors = (params: {
  pageNodeDefUuid: string
  descendantPageUuids: string[]
  record: Record
}): boolean => getPageValidationStatus(params).hasErrors

/**
 * Progress of pages without own-field validation errors over all survey pages.
 * Warnings do not reduce the score (matches Arena sidebar red-icon signal).
 */
export const getRecordPagesValidationProgress = (params: {
  survey: Survey
  record: Record
  cycle?: string
}): PagesValidationProgress | null => {
  const { survey, record } = params
  if (!getRoot(record)) return null

  const cycle = params.cycle ?? getCycle(record)
  const pageNodeDefs = getPageNodeDefs({ survey, cycle })
  const totalCount = pageNodeDefs.length
  if (totalCount === 0) return null

  let validCount = 0
  for (const pageNodeDef of pageNodeDefs) {
    const pageNodeDefUuid = pageNodeDef.uuid
    const descendantPageUuids = getDescendantPageNodeDefUuids({ survey, cycle, pageNodeDef })
    if (!pageHasOwnErrors({ pageNodeDefUuid, descendantPageUuids, record })) {
      validCount += 1
    }
  }

  const percent = Math.round((validCount / totalCount) * 100)
  return { percent, validCount, totalCount }
}
