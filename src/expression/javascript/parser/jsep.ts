import jsep from 'jsep'
import jsepRegex from '@jsep-plugin/regex'

jsep.plugins.register(jsepRegex as unknown as jsep.IPlugin)

// Add exponentiation operator (right-to-left)
jsep.addBinaryOp('**', 11, true)

const OPEN_PARENTHESIS_CODE = 40 // (
const CLOSE_PARENTHESIS_CODE = 41 // )

const SEQUENCE_EXPRESSION = 'SequenceExpression'

// keep sequence expressions in parsed expression, even when there is only one node inside of it
// (by default the unnecessary enclosing parenthesis of a sequence expression are omitted, but this won't work in the basic expression editor)
const sequenceExpressionPlugin = {
  name: 'the plugin',
  init(thisJsep: any) {
    thisJsep.hooks.add('gobble-token', (env: any): void => {
      const { context } = env
      // token starts with
      if (!thisJsep.isIdentifierStart(context.code) && context.code === OPEN_PARENTHESIS_CODE) {
        context.index += 1
        let nodes = context.gobbleExpressions(CLOSE_PARENTHESIS_CODE)
        if (context.code === CLOSE_PARENTHESIS_CODE) {
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
