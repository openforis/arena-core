export interface ArenaFactory<T, P> {
  createInstance(params?: P): T
}
