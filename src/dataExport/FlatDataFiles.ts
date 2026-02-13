import { NodeDef, NodeDefs } from '../nodeDef'
import { Strings } from '../utils'

const attachedFilesSubfolderName = 'files'

const getFileName = ({
  nodeDef,
  index,
  extension = 'csv',
}: {
  nodeDef: NodeDef<any>
  index: number
  extension: string
}): string => {
  const prefix = Strings.padStart(2, '0')(String(index + 1))
  return `${prefix}_${NodeDefs.getName(nodeDef)}.${extension}`
}

export const FlatDataFiles = {
  attachedFilesSubfolderName,
  getFileName,
}
