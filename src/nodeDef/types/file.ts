import { ArenaNodeDef, ArenaNodeDefProps, NodeDefType } from '../nodeDef'

export enum NodeDefFileType {
  audio = 'audio',
  image = 'image',
  video = 'video',
  other = 'other',
}

export interface ArenaNodeDefFileProps extends ArenaNodeDefProps {
  fileType?: NodeDefFileType
  maxFileSize?: number
  geotagInformationShown?: boolean
  screenCaptureInMapAllowed?: boolean // image files only: the map view can save its screen capture in it
}

export type ArenaNodeDefFile = ArenaNodeDef<NodeDefType.file, ArenaNodeDefFileProps>
