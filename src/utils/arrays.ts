const intersection = <T>(array1: T[], array2: T[]): T[] => array1.filter((item) => array2.indexOf(item) !== -1)

const startsWith = <T>(list: T[], start: T[]): boolean => start.every((item, index) => list[index] === item)

const last = <T>(array: T[] = []): T | undefined => (array.length > 0 ? array[array.length - 1] : undefined)

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

export const Arrays = {
  intersection,
  startsWith,
  last,
  addItem,
  addItems,
  removeItem,
}
