export type Role = 'USER' | 'ADMIN'

export interface User {
  id:           string
  githubId?:    string
  username:     string
  email?:       string
  name?:        string
  avatarUrl?:   string
  role:         Role
  createdAt:    string
  updatedAt:    string
}

export interface AuthTokens {
  accessToken: string
}
