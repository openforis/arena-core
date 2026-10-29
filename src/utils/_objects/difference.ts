import { isEqual } from './isEqual'

/**
 * Returns the props of otherObject missing in object or with a different value.
 */
export const difference = (object: any, otherObject: any): Record<any, any> =>
  Object.fromEntries(
    Object.entries(otherObject ?? {}).filter(
      ([key, value]) => !(object && Object.prototype.hasOwnProperty.call(object, key) && isEqual(object[key], value))
    )
  )
