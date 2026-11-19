/**
 * Options of the functions that return an updated version of the objects passed to them.
 */
export interface ArenaMutationOptions {
  /**
   * When true, the passed objects are modified in place instead of being copied: faster, but to be used only
   * on objects not shared with other code (e.g. objects just created). Default: false.
   */
  sideEffect?: boolean
}

/**
 * Converts the (deprecated) positional sideEffect boolean parameter into MutationOptions.
 */
export const toMutationOptions = (options?: ArenaMutationOptions | boolean): ArenaMutationOptions =>
  typeof options === 'boolean' ? { sideEffect: options } : (options ?? {})
