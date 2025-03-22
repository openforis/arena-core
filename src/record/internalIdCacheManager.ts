import { InternalIdCache } from './internalIdCache'

const getOrCreateId = (uuid: string, sideEffect: boolean) => (cache: InternalIdCache) => {
  const { idByUuid = {}, uuidById = {} } = cache
  let id = idByUuid[uuid]
  if (id) return { cache, id }

  id = cache.lastId ? Number(cache.lastId) + 1 : 1
  if (sideEffect) {
    idByUuid[uuid] = id
    cache.idByUuid = idByUuid
    uuidById[id] = uuid
    cache.uuidById = uuidById
    cache.lastId = id
    return { cache, id }
  } else {
    const cacheUpdated = {
      ...cache,
      idByUuid: { ...idByUuid, [uuid]: id },
      uuidById: { ...uuidById, [id]: uuid },
      lastId: id,
    }
    return { cache: cacheUpdated, id }
  }
}

export const InternalIdCacheManager = {
  getOrCreateId,
}
