import { MemberExpression } from '../../expression'
import { MemberEvaluator } from '../../expression/javascript/node/member'
import { NodeDefExpressionContext } from '../context'

const isNodeDef = (obj: any) => obj && typeof obj === 'object' && 'uuid' in obj

export class NodeDefMemberEvaluator extends MemberEvaluator<NodeDefExpressionContext> {
  async evaluate(expressionNode: MemberExpression): Promise<any> {
    const { object, property, computed } = expressionNode

    const objectEval = await this.evaluator.evaluateNode(object, this.context)
    if (objectEval === null) {
      return null
    }
    if (computed) {
      // access element at index (e.g. plot[1] or plot[index(...)]) or filter items
      // (e.g. plot[plot_id == 1]).
      // There is no actual array of node instances to index/filter at this (schema) level, so the
      // result is always the referenced node def itself. Still evaluate the property expression,
      // best-effort, so that any node def referenced inside an index/filter predicate (e.g. the
      // "plot_id == 1" part above, or a predicate referencing sibling/cousin node defs via
      // "$context") is registered as a dependency too. Errors are ignored here: this evaluation is
      // only performed to detect dependencies as a side effect, not to compute an actual value, and
      // it must not affect expression validation (e.g. NodeDefExpressionValidator) or cause other
      // referenced node defs found so far to be discarded by the caller.
      try {
        await this.evaluator.evaluateNode(property, {
          ...this.context,
          object: objectEval,
        })
      } catch {
        // ignore
      }
      return objectEval
    }

    // eval property and return it (e.g. plot.plot_id)
    // allow self node def reference because the referenced node at runtime can be different from current node
    // e.g. current node = plot_id ; expression = parent(plot).plot[index(plot) - 1].plot_id

    const propertyNodeDefContext = this.determinePropertyNodeDefContext(objectEval)

    return this.evaluator.evaluateNode(property, {
      ...this.context,
      object: objectEval,
      nodeDefContext: propertyNodeDefContext,
      selfReferenceAllowed: true,
    })
  }

  determinePropertyNodeDefContext(objectEval: any): any {
    if (isNodeDef(objectEval)) return objectEval
    if (Array.isArray(objectEval) && isNodeDef(objectEval[0])) return objectEval[0]
    return this.context.nodeDefContext
  }
}
