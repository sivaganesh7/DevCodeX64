export interface Repository {
  id:              string
  githubId:        number
  ownerId:         string
  fullName:        string
  name:            string
  description?:    string
  language?:       string
  defaultBranch:   string
  stargazersCount: number
  forksCount:      number
  isPrivate:       boolean
  cloneUrl:        string
  htmlUrl:         string
  createdAt:       string
  updatedAt:       string
}

export interface RepositoryBranch {
  id:           string
  repositoryId: string
  name:         string
  sha:          string
  isDefault:    boolean
  createdAt:    string
  updatedAt:    string
}

export interface RepositoryFile {
  id:           string
  repositoryId: string
  path:         string
  name:         string
  extension?:   string
  language?:    string
  sizeBytes?:   number
  lineCount?:   number
  isBinary:     boolean
  createdAt:    string
}
