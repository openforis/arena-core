import { ValidationFactory } from './factory'
import { Validation, ValidationMessage } from './validation'

export type PropsValidators = {
  [prop: string]: Array<(prop: string, obj: any) => ValidationMessage>
}

export class Validator {
  async validate(obj: any, propsValidators: PropsValidators, removeValidFields: boolean): Promise<Validation> {
    const fields = await Promise.all(Object.entries(propsValidators).map(([prop, propValidators]) => {}))

    return ValidationFactory.createInstance({ fields })
  }
}
