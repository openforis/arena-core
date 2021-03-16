import { Survey } from '../../survey'
import { Node } from '../../node'
import { Record } from '../record'
import { recordExpressionFunctions } from './functions'
import { JavascriptExpressionEvaluator } from 'src/expression'

export class RecordExpressionEvaluator extends JavascriptExpressionEvaluator {
  constructor() {
    super(recordExpressionFunctions, {})
  }
}