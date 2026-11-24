import { describe, test, expect } from '@jest/globals'

import { NodeDefFactory } from './factory'
import { ArenaNodeDefProps, NodeDefType } from './nodeDef'
import { NodeDefs } from './nodeDefs'
import { ArenaNodeDefFile, ArenaNodeDefFileProps, NodeDefFileType } from './types/file'
import { ArenaNodeDefGeo, ArenaNodeDefGeoProps } from './types/geo'
import { ArenaNodeDefTime, ArenaNodeDefTimeProps } from './types/time'

describe('NodeDefs.isSecondsIncluded', () => {
  test('is false when includeSeconds prop is not set', () => {
    const nodeDef = NodeDefFactory.createInstance({ type: NodeDefType.time }) as ArenaNodeDefTime
    expect(NodeDefs.isSecondsIncluded(nodeDef)).toBe(false)
  })

  test('is false when includeSeconds prop is explicitly false', () => {
    const nodeDef = NodeDefFactory.createInstance({
      type: NodeDefType.time,
      props: { includeSeconds: false } as ArenaNodeDefTimeProps,
    }) as ArenaNodeDefTime
    expect(NodeDefs.isSecondsIncluded(nodeDef)).toBe(false)
  })

  test('is true when includeSeconds prop is true', () => {
    const nodeDef = NodeDefFactory.createInstance({
      type: NodeDefType.time,
      props: { includeSeconds: true } as ArenaNodeDefTimeProps,
    }) as ArenaNodeDefTime
    expect(NodeDefs.isSecondsIncluded(nodeDef)).toBe(true)
  })
})

describe('NodeDefs.isPositionTracking', () => {
  test('is false when positionTracking prop is not set', () => {
    const nodeDef = NodeDefFactory.createInstance({ type: NodeDefType.geo }) as ArenaNodeDefGeo
    expect(NodeDefs.isPositionTracking(nodeDef)).toBe(false)
  })

  test('is true when positionTracking prop is true', () => {
    const nodeDef = NodeDefFactory.createInstance({
      type: NodeDefType.geo,
      props: { positionTracking: true } as ArenaNodeDefGeoProps,
    }) as ArenaNodeDefGeo
    expect(NodeDefs.isPositionTracking(nodeDef)).toBe(true)
  })
})

describe('NodeDefs.isScreenCaptureInMapAllowed', () => {
  test('is false when screenCaptureInMapAllowed prop is not set', () => {
    const nodeDef = NodeDefFactory.createInstance({ type: NodeDefType.file }) as ArenaNodeDefFile
    expect(NodeDefs.isScreenCaptureInMapAllowed(nodeDef)).toBe(false)
  })

  test('is true when screenCaptureInMapAllowed prop is true', () => {
    const nodeDef = NodeDefFactory.createInstance({
      type: NodeDefType.file,
      props: { fileType: NodeDefFileType.image, screenCaptureInMapAllowed: true } as ArenaNodeDefFileProps,
    }) as ArenaNodeDefFile
    expect(NodeDefs.isScreenCaptureInMapAllowed(nodeDef)).toBe(true)
  })
})

describe('NodeDefs type guards', () => {
  test.each([
    [NodeDefType.boolean, NodeDefs.isBoolean],
    [NodeDefType.code, NodeDefs.isCode],
    [NodeDefType.coordinate, NodeDefs.isCoordinate],
    [NodeDefType.date, NodeDefs.isDate],
    [NodeDefType.decimal, NodeDefs.isDecimal],
    [NodeDefType.entity, NodeDefs.isEntity],
    [NodeDefType.file, NodeDefs.isFile],
    [NodeDefType.geo, NodeDefs.isGeo],
    [NodeDefType.integer, NodeDefs.isInteger],
    [NodeDefType.taxon, NodeDefs.isTaxon],
    [NodeDefType.text, NodeDefs.isText],
    [NodeDefType.time, NodeDefs.isTime],
    [NodeDefType.formHeader, NodeDefs.isLayoutElement],
  ])('%s', (type, guard) => {
    expect(guard(NodeDefFactory.createInstance({ type }))).toBe(true)
    const otherType = type === NodeDefType.text ? NodeDefType.integer : NodeDefType.text
    expect(guard(NodeDefFactory.createInstance({ type: otherType }))).toBe(false)
  })

  test('narrows the node def type', () => {
    const nodeDef = NodeDefFactory.createInstance({ type: NodeDefType.time, props: { name: 'time' } })
    if (NodeDefs.isTime(nodeDef)) {
      // no cast needed to access time specific props
      expect(NodeDefs.isSecondsIncluded(nodeDef)).toBe(false)
    }
  })
})

describe('NodeDefs code and taxon getters', () => {
  test('read the props of code and taxon node defs without casts', () => {
    const codeDef = NodeDefFactory.createInstance({
      type: NodeDefType.code,
      props: { categoryUuid: 'category-uuid', parentCodeDefUuid: 'parent-code-def-uuid' } as ArenaNodeDefProps,
    })
    expect(NodeDefs.getCategoryUuid(codeDef)).toBe('category-uuid')
    expect(NodeDefs.getParentCodeDefUuid(codeDef)).toBe('parent-code-def-uuid')

    const taxonDef = NodeDefFactory.createInstance({
      type: NodeDefType.taxon,
      props: { taxonomyUuid: 'taxonomy-uuid' } as ArenaNodeDefProps,
    })
    expect(NodeDefs.getTaxonomyUuid(taxonDef)).toBe('taxonomy-uuid')
  })

  test('return undefined for node defs of other types', () => {
    const textDef = NodeDefFactory.createInstance({ type: NodeDefType.text })
    expect(NodeDefs.getCategoryUuid(textDef)).toBeUndefined()
    expect(NodeDefs.getParentCodeDefUuid(textDef)).toBeUndefined()
    expect(NodeDefs.getTaxonomyUuid(textDef)).toBeUndefined()
  })
})
