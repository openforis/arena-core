export type UserGroupQualifier = {
  name: string
  value: string
}

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
