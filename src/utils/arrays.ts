const intersection = <T>(array1: T[], array2: T[]): T[] => array1.filter((item) => array2.indexOf(item) !== -1)

const startsWith = <T>(list: T[], start: T[]): boolean => start.every((item, index) => list[index] === item)

const last = <T>(array: T[] = []): T | undefined => (array.length > 0 ? array[array.length - 1] : undefined)

export const Arrays = {
  intersection,
  startsWith,
  last,
}
