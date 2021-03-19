const intersection = <T>(array1: T[], array2: T[]): T[] => array1.filter((item) => array2.indexOf(item) !== -1)

const startsWith = <T>(array: T[], startWithArray: T[]): boolean =>
  !startWithArray.some((item, index) => array[index] !== item)

export const Arrays = {
  intersection,
  startsWith,
}
