// Entry names of the Arena format export (zip), shared by Arena (export / import) and Arena Mobile
// (records export, survey package download)

const separator = '/'

const dir = {
  activityLog: 'activitylog',
  categories: 'categories',
  chains: 'chains',
  files: 'files',
  records: 'records',
  surveyFiles: 'surveyfiles',
  taxonomies: 'taxonomies',
  users: 'users',
  userProfilePictures: ['users', 'profilepictures'].join(separator),
}

const path = (...parts: string[]): string => parts.join(separator)

export const ArenaExportFile = {
  activityLog: ({ index }: { index: number }): string => path(dir.activityLog, `activityLog_${index}.json`),
  categories: path(dir.categories, 'categories.json'),
  categoryItemsSingleFile: ({ categoryUuid }: { categoryUuid: string }): string =>
    path(dir.categories, `${categoryUuid}.json`),
  categoryItemsPart: ({ categoryUuid, index }: { categoryUuid: string; index: number }): string =>
    path(dir.categories, `${categoryUuid}_${index}.json`),
  chains: path(dir.chains, 'chains.json'),
  chain: ({ chainUuid }: { chainUuid: string }): string => path(dir.chains, `${chainUuid}.json`),
  // record files
  filesDir: dir.files,
  filesSummaries: path(dir.files, 'files.json'),
  file: ({ fileUuid }: { fileUuid: string }): string => path(dir.files, `${fileUuid}.bin`),
  info: 'info.json',
  recordsDir: dir.records,
  records: path(dir.records, 'records.json'),
  record: ({ recordUuid }: { recordUuid: string }): string => path(dir.records, `${recordUuid}.json`),
  survey: 'survey.json',
  // survey files (e.g. preloaded map layers, branding images)
  surveyFilesDir: dir.surveyFiles,
  surveyFile: ({ fileUuid }: { fileUuid: string }): string => path(dir.surveyFiles, `${fileUuid}.bin`),
  chainMauFilesSummaries: path(dir.surveyFiles, 'chainMauFiles.json'),
  taxonomies: path(dir.taxonomies, 'taxonomies.json'),
  taxa: ({ taxonomyUuid }: { taxonomyUuid: string }): string => path(dir.taxonomies, `${taxonomyUuid}.json`),
  taxaPart: ({ taxonomyUuid, index }: { taxonomyUuid: string; index: number }): string =>
    path(dir.taxonomies, `${taxonomyUuid}_${index}.json`),
  users: path(dir.users, 'users.json'),
  userInvitations: path(dir.users, 'userInvitations.json'),
  userProfilePicture: ({ userUuid }: { userUuid: string }): string => path(dir.userProfilePictures, userUuid),

  // deprecated (old export format)
  fileOld: ({ fileUuid }: { fileUuid: string }): string => path(dir.files, `${fileUuid}.json`),
}
