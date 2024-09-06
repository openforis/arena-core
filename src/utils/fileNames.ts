import { Objects } from './_objects'

const getExtension = (fileName: string | null | undefined): string => {
  if (Objects.isEmpty(fileName)) return ''
  const parts = String(fileName).split('.')
  return parts.length <= 1 ? '' : parts[parts.length - 1]
}

const addExtensionIfMissing = (fileName: string, defaultExtension: string): string => {
  const extension = getExtension(fileName)
  if (Objects.isNotEmpty(extension) || Objects.isEmpty(defaultExtension)) return fileName
  return [fileName, defaultExtension].join('.')
}

export const FileNames = {
  getExtension,
  addExtensionIfMissing,
}
