export type UserRole = 'admin' | 'specialist' | 'lawyer' | 'client'
export type CaseStatus = 'lead' | 'intake' | 'sent_to_attorney' | 'accepted' | 'rejected' | 'signed' | 'settled' | 'closed'
export type CaseType = 'auto_accident' | 'slip_and_fall' | 'workplace_injury' | 'medical_malpractice' | 'other'
export type NotificationChannel = 'email' | 'sms' | 'both'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      cases: {
        Row: Case
        Insert: Omit<Case, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Case, 'id' | 'created_at'>>
      }
      case_notes: {
        Row: CaseNote
        Insert: Omit<CaseNote, 'id' | 'created_at'>
        Update: Partial<Omit<CaseNote, 'id' | 'created_at'>>
      }
      case_assignments: {
        Row: CaseAssignment
        Insert: Omit<CaseAssignment, 'id' | 'assigned_at'>
        Update: Partial<Omit<CaseAssignment, 'id' | 'assigned_at'>>
      }
      notifications_log: {
        Row: NotificationLog
        Insert: Omit<NotificationLog, 'id' | 'sent_at'>
        Update: never
      }
      invitations: {
        Row: Invitation
        Insert: Omit<Invitation, 'id' | 'created_at'>
        Update: Partial<Omit<Invitation, 'id' | 'created_at'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      case_status: CaseStatus
      case_type: CaseType
    }
  }
}

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  phone: string | null
  firm_name: string | null
  avatar_url: string | null
  notification_channel: NotificationChannel
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Case {
  id: string
  case_number: string
  client_id: string
  assigned_specialist_id: string | null
  assigned_lawyer_id: string | null
  status: CaseStatus
  case_type: CaseType
  incident_date: string | null
  description: string | null
  accident_location: string | null
  injuries: string | null
  medical_provider: string | null
  police_report_number: string | null
  insurance_claim_number: string | null
  estimated_value: number | null
  settlement_amount: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CaseNote {
  id: string
  case_id: string
  author_id: string
  content: string
  is_internal: boolean
  created_at: string
}

export interface CaseAssignment {
  id: string
  case_id: string
  user_id: string
  role: 'specialist' | 'lawyer'
  assigned_at: string
}

export interface NotificationLog {
  id: string
  case_id: string | null
  recipient_id: string
  channel: 'email' | 'sms'
  subject: string | null
  body: string
  status: 'sent' | 'failed'
  sent_at: string
}

export interface Invitation {
  id: string
  email: string
  role: UserRole
  invited_by: string
  token: string
  accepted: boolean
  expires_at: string
  created_at: string
}
