const defaultServiceRegistryInstance = {
  taxonomyService: null,
}

export enum Services {
  taxonomyService = 'taxonomyService',
}

const servicesByType = {
  [Services.taxonomyService]: 'TaxonomyService',
}

let instance: any = null

// registers
const registerService = (type: Services) => {
  if (!instance) {
    instance = getInstance()
  }
  instance = {
    ...instance,
    [type]: instance[type] ?? servicesByType[type],
  }
  return instance
}

// getters
const getService = (type: Services) => instance[type] || null

// Registry functions
const registryFunctions = {
  registerService,
  getService,
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
