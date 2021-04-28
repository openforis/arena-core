import differenceWith from 'lodash.differencewith'

import { isEqual } from './isEqual'
import { fromPairs } from './fromPairs'
import { toPairs } from './toPairs'

export const difference = (object: any, otherObject: any): Record<any, any> => {
  const propsPairsOther = toPairs(otherObject)
  const propsPairsObject = toPairs(object)
  const propsDifference = differenceWith(propsPairsOther, propsPairsObject, isEqual)
  return fromPairs(propsDifference)
}
