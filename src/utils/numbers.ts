import { Objects } from './_objects'

const toNumber = (num: any): number => (Objects.isEmpty(num) ? NaN : Number(num))

const isFloat = (value: any): boolean => {
  const number = toNumber(value)
  return Number.isFinite(number)
}

const isInteger = (value: any): boolean => {
  const number = toNumber(value)
  return Number.isInteger(number)
}

const between = (value: number, min: number, max: number): boolean => min <= value && max >= value

export const Numbers = {
  between,
  isFloat,
  isInteger,
  toNumber,
}
