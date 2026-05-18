import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { CaseStatus, CaseType, UserRole } from '@/types/database'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatCurrency(amount: number | null) {
  if (amount === null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
}

export function generateCaseNumber() {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 90000) + 10000
  return `PIC-${year}-${random}`
}

export const STATUS_LABELS: Record<CaseStatus, string> = {
  lead: 'Lead',
  intake: 'Intake',
  sent_to_attorney: 'Sent to Attorney',
  accepted: 'Accepted',
  rejected: 'Rejected',
  signed: 'Signed',
  settled: 'Settled',
  closed: 'Closed',
}

export const STATUS_COLORS: Record<CaseStatus, string> = {
  lead: 'bg-blue-500/15 text-blue-400',
  intake: 'bg-amber-500/15 text-amber-400',
  sent_to_attorney: 'bg-purple-500/15 text-purple-400',
  accepted: 'bg-emerald-500/15 text-emerald-400',
  rejected: 'bg-red-500/15 text-red-400',
  signed: 'bg-violet-500/15 text-violet-400',
  settled: 'bg-emerald-500/15 text-emerald-400',
  closed: 'bg-zinc-500/15 text-zinc-400',
}

export const CASE_TYPE_LABELS: Record<CaseType, string> = {
  auto_accident: 'Auto Accident',
  slip_and_fall: 'Slip & Fall',
  workplace_injury: 'Workplace Injury',
  medical_malpractice: 'Medical Malpractice',
  other: 'Other',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  specialist: 'Specialist',
  lawyer: 'Lawyer',
  client: 'Client',
}

export const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-amber-500/15 text-amber-400',
  specialist: 'bg-blue-500/15 text-blue-400',
  lawyer: 'bg-emerald-500/15 text-emerald-400',
  client: 'bg-zinc-500/15 text-zinc-400',
}

export function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}
