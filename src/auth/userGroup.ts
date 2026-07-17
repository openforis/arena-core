export type UserGroupQualifier = {
  name: string
  value: string
}

export type UserGroupProps = {
  name?: string
  qualifiers?: UserGroupQualifier[]
}

export type UserGroup = {
  uuid: string
  surveyUuid?: string
  props: UserGroupProps
  dateCreated?: string
  dateModified?: string
}
