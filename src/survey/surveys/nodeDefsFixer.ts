import { NodeDef, NodeDefEntity, NodeDefEntityChildPosition, NodeDefMap, NodeDefs } from '../../nodeDef'
import { Objects } from '../../utils'

type NodeDefsFixParams = {
  nodeDefs: NodeDefMap
  cycle: string
  sideEffect: boolean
}

type NodeDefFixParams = NodeDefsFixParams & {
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

const fixIndexChildren = (params: {
  nodeDefs: NodeDefMap
  cycle: string
  nodeDef: NodeDefEntity
  sideEffect: boolean
}): NodeDef<any> | null =>
  fixLayoutProp({
    ...params,
    propName: 'indexChildren',
    fixerFn: ({ nodeDefs, cycle, propOld: indexChildrenOld }) =>
      indexChildrenOld.filter((childDefUuid: string) => {
        const childDef = nodeDefs[childDefUuid]
        return (
          childDef &&
          childDef.parentUuid === params.nodeDef.uuid &&
          (!NodeDefs.isEntity(childDef) || NodeDefs.isDisplayInOwnPage(cycle)(childDef as NodeDefEntity))
        )
      }),
  })

const fixLayoutChildren = (params: {
  nodeDefs: NodeDefMap
  cycle: string
  nodeDef: NodeDefEntity
  sideEffect: boolean
}): NodeDef<any> | null =>
  fixLayoutProp({
    ...params,
    propName: 'layoutChildren',
    fixerFn: ({ nodeDefs, cycle, propOld: layoutChildren }) =>
      layoutChildren.filter((item: string | NodeDefEntityChildPosition) => {
        const childDefUuid = typeof item === 'string' ? (item as string) : item.i
        const childDef = nodeDefs[childDefUuid]
        return (
          childDef &&
          childDef.parentUuid === params.nodeDef.uuid &&
          (!NodeDefs.isEntity(childDef) || !NodeDefs.isDisplayInOwnPage(cycle)(childDef as NodeDefEntity))
        )
      }),
  })

const fix = (params: NodeDefFixParams): NodeDef<any> | null => {
  const { nodeDef, nodeDefs } = params
  let fixedNodeDef = null
  const calculatedHierarchy = calculateNodeDefHierarchy({ nodeDefs, nodeDef })
  if (calculatedHierarchy.length !== NodeDefs.getMetaHieararchy(nodeDef).length) {
    fixedNodeDef = Objects.assocPath({ obj: nodeDef, path: ['meta', 'h'], value: calculatedHierarchy, sideEffect })
  }
  fixedNodeDef = fixIndexChildren(params)
  fixedNodeDef = fixLayoutChildren({ ...params, nodeDef: fixedNodeDef ?? nodeDef })
  return fixedNodeDef
}

const fixNodeDefs = (params: NodeDefsFixParams): { nodeDefs: NodeDef<any>[]; updatedNodeDefs: NodeDef<any>[] } => {
  const { nodeDefs } = params
  const nodeDefsResult = [] as NodeDef<any>[]
  const updatedNodeDefs = [] as NodeDef<any>[]

  Object.values(nodeDefs).forEach((nodeDef) => {
    const fixedNodeDef = fix({ ...params, nodeDef })
    if (fixedNodeDef) {
      updatedNodeDefs.push(fixedNodeDef)
    }
    nodeDefsResult.push(fixedNodeDef ?? nodeDef)
  })
  return {
    nodeDefs: nodeDefsResult,
    updatedNodeDefs,
  }
}

export const NodeDefsFixer = {
  fixNodeDefs,
}
