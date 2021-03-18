const intersection = (array1: any[], array2: any[]): any[] => array1.filter((item) => array2.indexOf(item) !== -1)

const startsWith = (array: any[], startWithArray: any[]): boolean =>
  !startWithArray.some((item, index) => array[index] !== item)

export const Arrays = {
  intersection,
  startsWith,
}
