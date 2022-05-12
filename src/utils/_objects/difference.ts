import differenceWith from 'lodash.differencewith'

import { isEqual } from './isEqual'
import { fromPairs } from './fromPairs'
import { toPairs } from './toPairs'

export const difference = (object: any, otherObject: any): Record<any, any> => {
  const pairsOther = toPairs(otherObject)
  const pairsObject = toPairs(object)
  const pairsDifference = differenceWith(pairsOther, pairsObject, isEqual)
  return fromPairs(pairsDifference)
}
