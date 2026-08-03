import { Node, Nodes } from '../../node'
import { NodeDefEntity, NodeDefs } from '../../nodeDef'
import { Survey, Surveys } from '../../survey'
import { Validations } from '../../validation'
import { Record } from '../record'
import { RecordValidations } from '../recordValidations'
import { getEntityCompletionStats } from './recordCompletion'
import { getCycle, getNodeByUuid, getNodesByDefUuid, getRoot } from './recordGetters'

export type PageValidationStatus = {
  hasErrors: boolean
  hasWarnings: boolean
}

export type EntitySubtreeStatus = {
  hasErrors: boolean
  hasWarnings: boolean
  isComplete: boolean
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

const nodeIsUnderEntity = (params: { node: Node; entityUuid: string }): boolean => {
  const { node, entityUuid } = params
  if (node.uuid === entityUuid) return true
  return Nodes.getHierarchy(node).includes(entityUuid)
}

const getOwnPageFieldValidationFlags = (params: {
  nodeUuid: string
  pageNodeDefUuid: string
  descendantPageUuids: string[]
  scopeEntityUuid?: string
  record: Record
  recordValidation: ReturnType<typeof Validations.getValidation>
}): PageValidationStatus | null => {
  const { nodeUuid, pageNodeDefUuid, descendantPageUuids, scopeEntityUuid, record, recordValidation } = params

  if (RecordValidations.isValidationChildrenCountKey(nodeUuid)) {
    return getOwnPageChildrenCountValidationFlags({
      childrenCountKey: nodeUuid,
      pageNodeDefUuid,
      descendantPageUuids,
      scopeEntityUuid,
      record,
      recordValidation,
    })
  }

  const node = getNodeByUuid(nodeUuid)(record)
  if (!node || !nodeBelongsToOwnPage({ node, pageNodeDefUuid, descendantPageUuids, record })) return null
  if (scopeEntityUuid && !nodeIsUnderEntity({ node, entityUuid: scopeEntityUuid })) return null

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
  scopeEntityUuid?: string
  record: Record
  recordValidation: ReturnType<typeof Validations.getValidation>
}): PageValidationStatus | null => {
  const { childrenCountKey, pageNodeDefUuid, descendantPageUuids, scopeEntityUuid, record, recordValidation } = params
  const parentUuid = RecordValidations.extractValidationChildrenCountKeyParentUuid(childrenCountKey)
  const childDefUuid = RecordValidations.extractValidationChildrenCountKeyNodeDefUuid(childrenCountKey)
  if (!parentUuid || !childDefUuid) return null

  // Sub-page entity min/max counts belong to navigation of nested pages, not this page's fields.
  if (descendantPageUuids.includes(childDefUuid)) return null

  const parentNode = getNodeByUuid(parentUuid)(record)
  if (!parentNode || !nodeBelongsToOwnPage({ node: parentNode, pageNodeDefUuid, descendantPageUuids, record })) {
    return null
  }
  if (scopeEntityUuid && !nodeIsUnderEntity({ node: parentNode, entityUuid: scopeEntityUuid })) return null

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
 * When scopeEntityUuid is set, only validations for nodes under that entity instance are included.
 */
export const getPageValidationStatus = (params: {
  pageNodeDefUuid: string
  descendantPageUuids?: string[]
  record: Record
  scopeEntityUuid?: string
}): PageValidationStatus => {
  const { pageNodeDefUuid, descendantPageUuids = [], record, scopeEntityUuid } = params
  const recordValidation = Validations.getValidation(record)
  const fields = Validations.getFieldValidations(recordValidation)
  let hasErrors = false
  let hasWarnings = false

  for (const nodeUuid of Object.keys(fields)) {
    const flags = getOwnPageFieldValidationFlags({
      nodeUuid,
      pageNodeDefUuid,
      descendantPageUuids,
      scopeEntityUuid,
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

const aggregatePageValidationStatuses = (statuses: PageValidationStatus[]): PageValidationStatus => ({
  hasErrors: statuses.some((status) => status.hasErrors),
  hasWarnings: statuses.some((status) => status.hasWarnings),
})

/**
 * Validation and completion status for one entity instance and its descendant pages.
 * Returns null when the node is missing or is not an entity.
 */
export const getEntitySubtreeStatus = (params: {
  survey: Survey
  record: Record
  entityUuid: string
  cycle?: string
}): EntitySubtreeStatus | null => {
  const { survey, record, entityUuid } = params
  const entity = getNodeByUuid(entityUuid)(record)
  if (!entity) return null

  const entityDef = Surveys.getNodeDefByUuid({ survey, uuid: entity.nodeDefUuid })
  if (!NodeDefs.isEntity(entityDef)) return null

  const cycle = params.cycle ?? getCycle(record)
  const entityPageDef = entityDef as NodeDefEntity
  const descendantPageUuids = getDescendantPageNodeDefUuids({ survey, cycle, pageNodeDef: entityPageDef })
  const pageUuidsToCheck = [entity.nodeDefUuid, ...descendantPageUuids]

  const validationStatuses = pageUuidsToCheck.map((pageNodeDefUuid) => {
    const pageNodeDef = Surveys.getNodeDefByUuid({ survey, uuid: pageNodeDefUuid }) as NodeDefEntity
    const pageDescendantUuids = getDescendantPageNodeDefUuids({ survey, cycle, pageNodeDef })
    return getPageValidationStatus({
      pageNodeDefUuid,
      descendantPageUuids: pageDescendantUuids,
      record,
      scopeEntityUuid: entityUuid,
    })
  })

  const { hasErrors, hasWarnings } = aggregatePageValidationStatuses(validationStatuses)
  const { total, filled } = getEntityCompletionStats({ survey, record, entity })
  const isComplete = total > 0 && filled === total && !hasErrors && !hasWarnings

  return { hasErrors, hasWarnings, isComplete }
}

/**
 * Aggregates subtree status across instances of a multiple page entity.
 * When `scopeEntityUuid` is set, only instances under that ancestor entity are included
 * (needed for nested multiples, e.g. Tree under the currently selected Plot).
 * Empty instance lists return a non-complete status with no validation flags.
 */
export const getMultiplePageEntitiesStatus = (params: {
  survey: Survey
  record: Record
  pageNodeDefUuid: string
  cycle?: string
  /** When set, only instances under this ancestor entity are aggregated. */
  scopeEntityUuid?: string
}): EntitySubtreeStatus => {
  const { survey, record, pageNodeDefUuid, scopeEntityUuid } = params
  const instances = getNodesByDefUuid(pageNodeDefUuid)(record).filter((instance) =>
    scopeEntityUuid ? nodeIsUnderEntity({ node: instance, entityUuid: scopeEntityUuid }) : true
  )

  if (instances.length === 0) {
    return { hasErrors: false, hasWarnings: false, isComplete: false }
  }

  const instanceStatuses = instances
    .map((instance) => getEntitySubtreeStatus({ survey, record, entityUuid: instance.uuid, cycle: params.cycle }))
    .filter((status): status is EntitySubtreeStatus => status !== null)

  return {
    hasErrors: instanceStatuses.some((status) => status.hasErrors),
    hasWarnings: instanceStatuses.some((status) => status.hasWarnings),
    isComplete: instanceStatuses.length > 0 && instanceStatuses.every((status) => status.isComplete),
  }
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
