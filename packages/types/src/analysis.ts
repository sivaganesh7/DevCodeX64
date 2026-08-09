export type JobStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
export type IssueSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'
export type IssueType = 'SECURITY' | 'QUALITY' | 'DEPENDENCY' | 'COMPLEXITY' | 'DUPLICATION'
export type SecurityFindingType = 'SECRET' | 'VULNERABILITY' | 'MISCONFIGURATION' | 'DEPENDENCY_CVE'
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type MessageRole = 'USER' | 'ASSISTANT'
export type DocType = 'README' | 'API' | 'ARCHITECTURE' | 'FUNCTION' | 'SETUP' | 'DATABASE' | 'DEVELOPER_GUIDE'

export interface AnalysisJob {
  id:           string
  repositoryId: string
  userId:       string
  branch:       string
  status:       JobStatus
  progress:     number
  currentStep?: string
  bullJobId?:   string
  startedAt?:   string
  completedAt?: string
  errorMessage?: string
  createdAt:    string
  updatedAt:    string
}

export interface AnalysisResult {
  id:                   string
  analysisJobId:        string
  healthScore?:         number
  qualityScore?:        number
  securityScore?:       number
  testingScore?:        number
  documentationScore?:  number
  maintainabilityScore?: number
  totalFiles?:          number
  totalLines?:          number
  languageBreakdown?:   Record<string, number>
  summary?:             string
  createdAt:            string
  updatedAt:            string
}

export interface CodeMetric {
  id:           string
  analysisJobId: string
  filePath:     string
  metricType:   string
  value:        number
  details?:     Record<string, unknown>
}

export interface SecurityFinding {
  id:              string
  analysisJobId:   string
  repositoryId:    string
  type:            SecurityFindingType
  severity:        IssueSeverity
  title:           string
  description:     string
  filePath?:       string
  lineNumber?:     number
  ruleId?:         string
  cveId?:          string
  isFalsePositive: boolean
  isResolved:      boolean
  resolvedAt?:     string
  createdAt:       string
}

export interface Dependency {
  id:             string
  analysisJobId:  string
  repositoryId:   string
  name:           string
  currentVersion?: string
  latestVersion?:  string
  isOutdated:     boolean
  isVulnerable:   boolean
  severity?:      IssueSeverity
  cveIds:         string[]
  license?:       string
  ecosystem?:     string
  isDirect:       boolean
  createdAt:      string
}

export interface Issue {
  id:            string
  analysisJobId: string
  repositoryId:  string
  type:          IssueType
  severity:      IssueSeverity
  title:         string
  description:   string
  filePath?:     string
  lineNumber?:   number
  columnNumber?: number
  ruleId?:       string
  recommendation?: string
  isResolved:    boolean
  resolvedAt?:   string
  createdAt:     string
}

export interface RiskPrediction {
  id:            string
  analysisJobId: string
  repositoryId:  string
  filePath?:     string
  riskLevel:     RiskLevel
  riskScore:     number
  confidence?:   number
  features?:     Record<string, number>
  modelVersion?: string
  createdAt:     string
}

export interface Conversation {
  id:           string
  repositoryId: string
  userId:       string
  title?:       string
  createdAt:    string
  updatedAt:    string
}

export interface MessageSource {
  file:       string
  lineStart:  number
  lineEnd:    number
  snippet:    string
}

export interface Message {
  id:             string
  conversationId: string
  role:           MessageRole
  content:        string
  sources?:       MessageSource[]
  tokenCount?:    number
  createdAt:      string
}

export interface PullRequest {
  id:              string
  repositoryId:    string
  githubPrId:      number
  number:          number
  title:           string
  body?:           string
  state:           string
  author:          string
  baseBranch:      string
  headBranch:      string
  htmlUrl:         string
  githubCreatedAt?: string
  githubUpdatedAt?: string
  createdAt:       string
  updatedAt:       string
}

export interface PullRequestReview {
  id:             string
  pullRequestId:  string
  analysisJobId?: string
  summary?:       string
  riskLevel?:     RiskLevel
  issuesFound:    number
  securityIssues: number
  reviewData?:    Record<string, unknown>
  postedToGithub: boolean
  githubCommentId?: string
  createdAt:      string
  updatedAt:      string
}

export interface GeneratedTest {
  id:              string
  repositoryId:    string
  analysisJobId?:  string
  userId:          string
  filePath:        string
  functionName?:   string
  testContent:     string
  language:        string
  framework?:      string
  executionStatus?: string
  executionOutput?: string
  executedAt?:     string
  createdAt:       string
  updatedAt:       string
}

export interface Documentation {
  id:           string
  repositoryId: string
  analysisJobId?: string
  userId:       string
  docType:      DocType
  title:        string
  content:      string
  filePath?:    string
  createdAt:    string
  updatedAt:    string
}

export interface AuditLog {
  id:         string
  userId?:    string
  action:     string
  entityType?: string
  entityId?:  string
  ipAddress?: string
  metadata?:  Record<string, unknown>
  createdAt:  string
}
