export const isEmpty = (value: any) =>
  value === null ||
  value === '' ||
  Number.isNaN(value) ||
  (value instanceof Object && Object.entries(value).length === 0) ||
  (Array.isArray(value) && value.length === 0)
