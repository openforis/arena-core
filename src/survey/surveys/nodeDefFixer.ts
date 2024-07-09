import { NodeDef, NodeDefEntity, NodeDefEntityChildPosition } from '../../nodeDef'
import { Survey } from '../survey'
import { Objects } from '../../utils'
import { findNodeDefByUuid } from './nodeDefs'

type NodeDefFixParams = {
  survey: Survey
  cycle: string
  nodeDef: NodeDef<any>
  sideEffect: boolean
}

type LayoutPropFixParams = NodeDefFixParams & {
  propName: string
}

type LayoutPropFixerFnParams = LayoutPropFixParams & { propOld: any }

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
  survey: Survey
  cycle: string
  nodeDef: NodeDefEntity
  sideEffect: boolean
}): NodeDef<any> | null =>
  fixLayoutProp({
    ...params,
    propName: 'indexChildren',
    fixerFn: ({ survey, propOld: indexChildrenOld }) =>
      indexChildrenOld.reduce((acc: string[], childDefUuid: string) => {
        const childDef = findNodeDefByUuid({ survey, uuid: childDefUuid })
        if (childDef && childDef.parentUuid === params.nodeDef.uuid) {
          acc.push(childDefUuid)
        }
        return acc
      }, []),
  })

const fixLayoutChildren = (params: {
  survey: Survey
  cycle: string
  nodeDef: NodeDefEntity
  sideEffect: boolean
}): NodeDef<any> | null =>
  fixLayoutProp({
    ...params,
    propName: 'layoutChildren',
    fixerFn: ({ survey, propOld: layoutChildren }) =>
      layoutChildren.reduce(
        (acc: (string | NodeDefEntityChildPosition)[], item: string | NodeDefEntityChildPosition) => {
          const childDefUuid = typeof item === 'string' ? (item as string) : item.i
          const childDef = findNodeDefByUuid({ survey, uuid: childDefUuid })
          if (childDef && childDef.parentUuid === params.nodeDef.uuid) {
            acc.push(item)
          }
          return acc
        },
        []
      ),
  })

const fix = (params: NodeDefFixParams): NodeDef<any> | null => {
  const { nodeDef } = params
  let nodeDefUpdated = fixIndexChildren(params)
  nodeDefUpdated = fixLayoutChildren({ ...params, nodeDef: nodeDefUpdated ?? nodeDef })
  return nodeDefUpdated
}

export const NodeDefFixer = {
  fix,
}
