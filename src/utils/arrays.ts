const intersection = <T>(array1: T[], array2: T[]): T[] => array1.filter((item) => array2.indexOf(item) !== -1)

const startsWith = <T>(list: T[], start: T[]): boolean => start.every((item, index) => list[index] === item)

const last = <T>(array: T[] = []): T | undefined => array.at(-1) // .slice(-1)[0]

export const Arrays = {
  intersection,
  startsWith,
  last,
}
