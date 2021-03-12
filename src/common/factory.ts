export interface Factory<T> {
  createInstance(params?: any): T
}
