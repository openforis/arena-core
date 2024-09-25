const addItems =
  <T>(items: T[], options?: { sideEffect?: boolean }) =>
  (array: T[]): T[] => {
    const { sideEffect = false } = options ?? {}
    if (sideEffect) {
      array.push(...items)
      return array
    }
    return array.concat(items)
  }
const addItem =
  <T>(item: T, options?: { sideEffect?: boolean }) =>
  (array: T[]): T[] =>
    addItems([item], options)(array)

const fromNumberOfElements = (numOfElements: number): number[] => Array.from(Array(numOfElements).keys())

const intersection = <T>(array1: T[], array2: T[]): T[] => array1.filter((item) => array2.indexOf(item) !== -1)

const last = <T>(array: T[] = []): T | undefined => (array.length > 0 ? array[array.length - 1] : undefined)

const removeItem =
  <T>(item: T) =>
  (array: T[]): T[] => {
    const result = [...array]
    const itemIndex = array.indexOf(item)
    if (itemIndex >= 0) {
      result.splice(itemIndex, 1)
    }
    return result
  }

const startsWith = <T>(list: T[], start: T[]): boolean => start.every((item, index) => list[index] === item)

const toArray = (value: any): any[] => {
  if (value === null || value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

export const Arrays = {
  addItem,
  addItems,
  fromNumberOfElements,
  intersection,
  last,
  removeItem,
  startsWith,
  toArray,
}
