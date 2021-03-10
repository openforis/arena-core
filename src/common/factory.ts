export interface Factory<T> {
  createInstance(options?: any): T
}
