// arrays are copied as arrays
export const shallowCopy = <T extends object>(obj: T): T => (Array.isArray(obj) ? [...obj] : { ...obj }) as T
