import jsep from 'jsep'

// Add exponentiation operator (right-to-left)
jsep.addBinaryOp('**', 11, true)

const OPAREN_CODE = 40 // (
const CPAREN_CODE = 41 // )

const SEQUENCE_EXPRESSION = 'SequenceExpression'

// keep sequence expressions in parsed expression, even when there is only one node inside of it
// (by default the unnecessary enclosing parenthesis of a sequence expression are omitted, but this won't work in the basic expression editor)
const sequenceExpressionPlugin = {
  name: 'the plugin',
  init(jsep: any) {
    jsep.hooks.add('gobble-token', (env: any): void => {
      const { context } = env
      // token starts with
      if (!jsep.isIdentifierStart(context.code) && context.code === OPAREN_CODE) {
        context.index += 1
        let nodes = context.gobbleExpressions(CPAREN_CODE)
        if (context.code === CPAREN_CODE) {
          context.index += 1
          if (nodes.length > 0) {
            env.node = {
              type: SEQUENCE_EXPRESSION,
              expression: nodes[0],
            }
          }
        } else {
          context.throwError('Unclosed (')
        }
      }
    })
  },
}

jsep.plugins.register(sequenceExpressionPlugin as jsep.IPlugin)

export { jsep }
