export type ArenaUserGroupQualifier = {
  name: string
  value: string
}

export type ArenaUserGroupProps = {
  name?: string
  qualifiers?: ArenaUserGroupQualifier[]
  /**
   * uuids of other groups of the same survey whose records the members can read but not edit
   */
  readableGroupUuids?: string[]
}

export type ArenaUserGroup = {
  uuid: string
  surveyUuid?: string
  props: ArenaUserGroupProps
  dateCreated?: string
  dateModified?: string
}
