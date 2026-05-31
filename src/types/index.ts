// Types for MeetMind AI

export interface User {
  id: string
  email: string
  displayName?: string
  avatarUrl?: string
}

export interface Job {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  step?: string
  progressPct?: number
  meetingId?: string
  fileName: string
  fileSizeBytes?: number
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

export interface Speaker {
  id: string
  speakerKey: string
  displayName: string
  color: string
}

export interface TranscriptSegment {
  start: number
  end: number
  speaker: string
  text: string
  language: string
}

export interface ActionItem {
  id: string
  task: string
  owner?: string
  deadline?: string
  context?: string
  priority: 'high' | 'medium' | 'low'
  isCompleted: boolean
}

export interface Meeting {
  id: string
  jobId: string
  title: string
  durationSeconds: number
  languagesDetected: string[]
  speakerCount: number
  transcript: TranscriptSegment[]
  minutesEn: string
  minutesUr?: string
  summaryEn?: string
  actionItems: ActionItem[]
  speakers: Speaker[]
  shareToken?: string
  createdAt: string
}

export type ExportFormat = 'pdf' | 'docx' | 'srt' | 'gdocs'
export type OutputLanguage = 'en' | 'ur'

export interface ExportResult {
  downloadUrl?: string
  externalUrl?: string
  expiresAt?: string
}

export type PipelineStep =
  | 'uploaded'
  | 'converting'
  | 'transcribing'
  | 'diarizing'
  | 'generating_minutes'
  | 'extracting_actions'
  | 'preparing_exports'
  | 'completed'
