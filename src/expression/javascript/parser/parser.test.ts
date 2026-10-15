import { describe, expect, test } from '@jest/globals'

import { ExpressionNodeType } from '../../node'
import { JavascriptExpressionParser } from './parser'

describe('JavascriptExpressionParser', () => {
  test('parsed nodes can be narrowed by type', () => {
    const node = new JavascriptExpressionParser().parse('plot.tree(dbh)')

    expect(node.type).toBe(ExpressionNodeType.Call)
    if (node.type !== ExpressionNodeType.Call) return

    const { callee, arguments: args } = node
    expect(callee.type).toBe(ExpressionNodeType.Member)
    if (callee.type !== ExpressionNodeType.Member) return

    // object and property are typed as expression nodes too: narrowing gives access to their props
    const { object, property } = callee
    expect(object.type === ExpressionNodeType.Identifier ? object.name : null).toBe('plot')
    expect(property.type === ExpressionNodeType.Identifier ? property.name : null).toBe('tree')
    expect(args.map((arg) => (arg.type === ExpressionNodeType.Identifier ? arg.name : null))).toEqual(['dbh'])
  })
})
