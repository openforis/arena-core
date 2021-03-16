export interface Factory<T, P> {
  createInstance(params?: P): T
}
