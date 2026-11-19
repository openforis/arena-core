import { SystemError, SystemErrorKeys } from '../error'
import { ArenaNodeDef, ArenaNodeDefEntity, ArenaNodeDefMap, NodeDefs } from '../nodeDef'
import { ArenaNodeDefEntityLayoutChildItem } from '../nodeDef/types/entity'
import { Objects } from '../utils'
import { ArenaMutationOptions } from '../utils/mutationOptions'

type NodeDefsFixParams = ArenaMutationOptions & {
  nodeDefs: ArenaNodeDefMap
  cycles: string[]
}

type NodeDefsInCycleFixParams = NodeDefsFixParams & {
  cycle: string
}

type NodeDefFixParams = NodeDefsInCycleFixParams & {
  nodeDef: ArenaNodeDef<any>
}

type LayoutPropFixParams = NodeDefFixParams & {
  propName: string
}

type LayoutPropFixerFnParams = LayoutPropFixParams & { propOld: any }

const calculateNodeDefHierarchy = (params: { nodeDef: ArenaNodeDef<any>; nodeDefs: ArenaNodeDefMap }): string[] => {
  const { nodeDef, nodeDefs } = params
  const hierarchy = []
  const visitedNodeDefUuids = new Set<string>()
  let currentParentUuid = nodeDef.parentUuid
  while (currentParentUuid) {
    if (visitedNodeDefUuids.has(currentParentUuid)) {
      throw new SystemError(SystemErrorKeys.nodeDef.hierarchyCircularDependency, {
        nodeDefName: nodeDef.props?.name,
        nodeDefUuid: nodeDef.uuid,
        parentUuid: currentParentUuid,
      })
    }
    visitedNodeDefUuids.add(currentParentUuid)
    hierarchy.unshift(currentParentUuid)
    const currentParentNode = nodeDefs[currentParentUuid]
    if (!currentParentNode) {
      throw new SystemError(SystemErrorKeys.nodeDef.parentNotFound, {
        nodeDefName: nodeDef.props?.name,
        nodeDefUuid: nodeDef.uuid,
        parentUuid: currentParentUuid,
      })
    }
    currentParentUuid = currentParentNode.parentUuid
  }
  return hierarchy
}

const fixHierarchy = (params: NodeDefFixParams): ArenaNodeDef<any> | null => {
  const { nodeDefs, nodeDef, sideEffect } = params
  const calculatedHierarchy = calculateNodeDefHierarchy({ nodeDefs, nodeDef })
  // compare the whole hierarchy: a node def moved to another parent at the same depth has a hierarchy with the same length
  return Objects.isEqual(calculatedHierarchy, NodeDefs.getMetaHierarchy(nodeDef))
    ? null
    : Objects.assocPath({ obj: nodeDef, path: ['meta', 'h'], value: calculatedHierarchy, sideEffect })
}

const fixLayoutProp = (
  params: LayoutPropFixParams & { fixerFn: (params: LayoutPropFixerFnParams) => any }
): ArenaNodeDef<any> | null => {
  const { cycle, nodeDef, propName, sideEffect, fixerFn } = params

  const propPath = ['props', 'layout', cycle, propName]

  const propOld = Objects.path(propPath)(nodeDef)

  if (Objects.isEmpty(propOld)) return null

  const propFixed = fixerFn({ ...params, propOld })

  if (Objects.isEqual(propOld, propFixed)) return null

  return Objects.assocPath({
    obj: nodeDef,
    path: propPath,
    value: propFixed,
    sideEffect,
  })
}

const fixIndexChildren = (params: NodeDefFixParams): ArenaNodeDef<any> | null =>
  fixLayoutProp({
    ...params,
    propName: 'indexChildren',
    fixerFn: ({ nodeDefs, cycle, propOld: indexChildren }) =>
      (indexChildren as string[]).filter((childDefUuid) => {
        const childDef = nodeDefs[childDefUuid]
        return (
          childDef?.parentUuid === params.nodeDef.uuid &&
          NodeDefs.isEntity(childDef) &&
          NodeDefs.isDisplayInOwnPage(cycle)(childDef as ArenaNodeDefEntity)
        )
      }),
  })

const fixLayoutChildren = (params: NodeDefFixParams): ArenaNodeDef<any> | null =>
  fixLayoutProp({
    ...params,
    propName: 'layoutChildren',
    fixerFn: ({ nodeDefs, cycle, propOld: layoutChildren }) =>
      (layoutChildren as ArenaNodeDefEntityLayoutChildItem[]).filter((item) => {
        const childDefUuid = typeof item === 'string' ? item : item.i
        const childDef = nodeDefs[childDefUuid]
        return (
          childDef?.parentUuid === params.nodeDef.uuid &&
          (!NodeDefs.isEntity(childDef) || !NodeDefs.isDisplayInOwnPage(cycle)(childDef as ArenaNodeDefEntity))
        )
      }),
  })

const fix = (params: NodeDefFixParams): ArenaNodeDef<any> | null => {
  const { nodeDef } = params
  let nodeDefFixed: ArenaNodeDef<any> | null = fixHierarchy(params)
  if (NodeDefs.isEntity(nodeDef)) {
    nodeDefFixed = fixIndexChildren({ ...params, nodeDef: nodeDefFixed ?? nodeDef }) ?? nodeDefFixed
    nodeDefFixed = fixLayoutChildren({ ...params, nodeDef: nodeDefFixed ?? nodeDef }) ?? nodeDefFixed
  }
  return nodeDefFixed
}

const fixNodeDefs = (params: NodeDefsFixParams): { nodeDefs: ArenaNodeDefMap; updatedNodeDefs: ArenaNodeDefMap } => {
  const { nodeDefs, cycles } = params
  const nodeDefsResult: ArenaNodeDefMap = { ...nodeDefs }
  const updatedNodeDefs: ArenaNodeDefMap = {}

  for (const cycle of cycles) {
    for (const nodeDef of Object.values(nodeDefs)) {
      const nodeDefToFix = nodeDefsResult[nodeDef.uuid] ?? nodeDef
      const fixedNodeDef = fix({ ...params, cycle, nodeDef: nodeDefToFix })
      if (fixedNodeDef) {
        updatedNodeDefs[nodeDef.uuid] = fixedNodeDef
      }
      nodeDefsResult[nodeDef.uuid] = fixedNodeDef ?? nodeDefToFix
    }
  }
  return {
    nodeDefs: nodeDefsResult,
    updatedNodeDefs,
  }
}

export const NodeDefsFixer = {
  fixNodeDefs,
}
