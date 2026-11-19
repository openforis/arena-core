export type UserGroupQualifier = {
  name: string
  value: string
}

/** Alias of UserGroupQualifier, not clashing with the UserGroupQualifier modules of the consumers. */
export type ArenaUserGroupQualifier = UserGroupQualifier

export type UserGroupProps = {
  name?: string
  qualifiers?: UserGroupQualifier[]
  /**
   * uuids of other groups of the same survey whose records the members can read but not edit
   */
  readableGroupUuids?: string[]
}

export type UserGroup = {
  uuid: string
  surveyUuid?: string
  props: UserGroupProps
  dateCreated?: string
  dateModified?: string
}

/** Alias of UserGroup, not clashing with the UserGroup modules of the consumers. */
export type ArenaUserGroup = UserGroup
