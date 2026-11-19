import { ArenaValidationResult } from './validation'

export type ArenaFieldValidator = (field: string, obj: any) => Promise<ArenaValidationResult>
