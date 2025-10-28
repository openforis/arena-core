import { NodeDef, NodeDefEntity, NodeDefMap, NodeDefs } from '../nodeDef'
import { NodeDefEntityLayoutChildItem } from '../nodeDef/types/entity'
import { Objects } from '../utils'

type NodeDefsFixParams = {
  nodeDefs: NodeDefMap
  sideEffect?: boolean
  cycles: string[]
}

type NodeDefsInCycleFixParams = NodeDefsFixParams & {
  cycle: string
}

type NodeDefFixParams = NodeDefsInCycleFixParams & {
  nodeDef: NodeDef<any>
}

type LayoutPropFixParams = NodeDefFixParams & {
  propName: string
}

type LayoutPropFixerFnParams = LayoutPropFixParams & { propOld: any }

const calculateNodeDefHierarchy = (params: { nodeDef: NodeDef<any>; nodeDefs: NodeDefMap }): string[] => {
  const { nodeDef, nodeDefs } = params
  const hiearchy = []
  let currentParentUuid = nodeDef.parentUuid
  while (currentParentUuid) {
    hiearchy.unshift(currentParentUuid)
    const currentParentNode = nodeDefs[currentParentUuid]
    currentParentUuid = currentParentNode.parentUuid
  }
  return hiearchy
}

const fixHiearchy = (params: NodeDefFixParams): NodeDef<any> | null => {
  const { nodeDefs, nodeDef, sideEffect } = params
  const calculatedHierarchy = calculateNodeDefHierarchy({ nodeDefs, nodeDef })
  return calculatedHierarchy.length !== NodeDefs.getMetaHieararchy(nodeDef).length
    ? Objects.assocPath({ obj: nodeDef, path: ['meta', 'h'], value: calculatedHierarchy, sideEffect })
    : null
}

const fixLayoutProp = (
  params: LayoutPropFixParams & { fixerFn: (params: LayoutPropFixerFnParams) => any }
): NodeDef<any> | null => {
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

const fixIndexChildren = (params: NodeDefFixParams): NodeDef<any> | null =>
  fixLayoutProp({
    ...params,
    propName: 'indexChildren',
    fixerFn: ({ nodeDefs, cycle, propOld: indexChildren }) =>
      (indexChildren as string[]).filter((childDefUuid) => {
        const childDef = nodeDefs[childDefUuid]
        return (
          childDef &&
          childDef.parentUuid === params.nodeDef.uuid &&
          NodeDefs.isEntity(childDef) &&
          NodeDefs.isDisplayInOwnPage(cycle)(childDef as NodeDefEntity)
        )
      }),
  })

const fixLayoutChildren = (params: NodeDefFixParams): NodeDef<any> | null =>
  fixLayoutProp({
    ...params,
    propName: 'layoutChildren',
    fixerFn: ({ nodeDefs, cycle, propOld: layoutChildren }) =>
      (layoutChildren as NodeDefEntityLayoutChildItem[]).filter((item) => {
        const childDefUuid = typeof item === 'string' ? item : item.i
        const childDef = nodeDefs[childDefUuid]
        return (
          childDef &&
          childDef.parentUuid === params.nodeDef.uuid &&
          (!NodeDefs.isEntity(childDef) || !NodeDefs.isDisplayInOwnPage(cycle)(childDef as NodeDefEntity))
        )
      }),
  })

const fix = (params: NodeDefFixParams): NodeDef<any> | null => {
  const { nodeDef } = params
  let nodeDefFixed: NodeDef<any> | null = fixHiearchy(params)
  if (NodeDefs.isEntity(nodeDef)) {
    nodeDefFixed = fixIndexChildren({ ...params, nodeDef: nodeDefFixed ?? nodeDef }) ?? nodeDefFixed
    nodeDefFixed = fixLayoutChildren({ ...params, nodeDef: nodeDefFixed ?? nodeDef }) ?? nodeDefFixed
  }
  return nodeDefFixed
}

const fixNodeDefs = (params: NodeDefsFixParams): { nodeDefs: NodeDefMap; updatedNodeDefs: NodeDefMap } => {
  const { nodeDefs, cycles } = params
  const nodeDefsResult: NodeDefMap = {}
  const updatedNodeDefs: NodeDefMap = {}

  for (const cycle of cycles) {
    for (const nodeDef of Object.values(nodeDefs)) {
      const nodeDefToFix = nodeDefsResult[nodeDef.uuid] ?? nodeDef
      const fixedNodeDef = fix({ ...params, cycle, nodeDef: nodeDefToFix })
      if (fixedNodeDef) {
        updatedNodeDefs[nodeDef.uuid] = fixedNodeDef
      }
      nodeDefsResult[nodeDef.uuid] = fixedNodeDef ?? nodeDef
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
