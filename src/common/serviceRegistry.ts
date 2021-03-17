const defaultServiceRegistryInstance = {
  taxonomyService: null,
}

export enum _Services {
  taxonomyService = 'taxonomyService',
}

let instance: any = null

// registers
const _registerService = (type: _Services) => (service: any) => {
  if (!instance) {
    instance = getInstance()
  }
  instance = {
    ...instance,
    [type]: instance[type] ?? new service(),
  }
  return instance
}

const _getService = (type: _Services) => () => instance[type] || null

// Taxonomy
const registerTaxonomyService = _registerService(_Services.taxonomyService)
const getTaxonomyService = _getService(_Services.taxonomyService)

// Registry functions
const registryFunctions = {
  //Taxonomy
  registerTaxonomyService,
  getTaxonomyService,
}

const getInstance = (): any => {
  if (!instance) {
    instance = {
      ...defaultServiceRegistryInstance,
      ...registryFunctions,
    }
  }
  return instance
}

export const ServiceRegistry = {
  getInstance,
}
