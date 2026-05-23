import twilio from 'twilio'
import { Resend } from 'resend'
import type { CaseStatus } from '@/types/database'
import { STATUS_LABELS } from './utils'

const resend = new Resend(process.env.RESEND_API_KEY)

function getTwilioClient() {
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
}

export async function sendSMS(to: string, body: string) {
  try {
    const client = getTwilioClient()
    await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    })
    return { success: true }
  } catch (error) {
    console.error('SMS error:', error)
    return { success: false, error }
  }
}

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to,
      subject,
      html,
    })
    return { success: true }
  } catch (error) {
    console.error('Email error:', error)
    return { success: false, error }
  }
}

export async function sendInviteEmail(to: string, inviterName: string, role: string, token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const link = `${appUrl}/accept-invite?token=${token}`

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0a0c10;color:#f0f2f7;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#c9a84c,#e8c76a);padding:24px 32px">
        <h1 style="margin:0;color:#0a0c10;font-size:20px;font-weight:700">Pinnacle Injury Consultants</h1>
        <p style="margin:4px 0 0;color:#0a0c10;opacity:.7;font-size:13px">Case Management Platform</p>
      </div>
      <div style="padding:32px">
        <h2 style="margin:0 0 12px;font-size:22px">You've been invited</h2>
        <p style="color:#8d95a8;line-height:1.6;margin:0 0 24px">
          <strong style="color:#f0f2f7">${inviterName}</strong> has invited you to join the Pinnacle Injury Consultants case management platform as a <strong style="color:#f0f2f7">${role}</strong>.
        </p>
        <a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#e8c76a);color:#0a0c10;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px">
          Accept Invitation
        </a>
        <p style="margin:24px 0 0;font-size:12px;color:#4e5668">
          This link expires in 7 days. If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </div>
    </div>
  `

  return sendEmail(to, 'You\'ve been invited to Pinnacle Case Management', html)
}

export async function sendCaseStatusEmail(
  to: string,
  clientName: string,
  caseNumber: string,
  newStatus: CaseStatus,
  notes?: string
) {
  const statusLabel = STATUS_LABELS[newStatus]
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0a0c10;color:#f0f2f7;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#c9a84c,#e8c76a);padding:24px 32px">
        <h1 style="margin:0;color:#0a0c10;font-size:20px;font-weight:700">Pinnacle Injury Consultants</h1>
        <p style="margin:4px 0 0;color:#0a0c10;opacity:.7;font-size:13px">Case Update Notification</p>
      </div>
      <div style="padding:32px">
        <h2 style="margin:0 0 12px;font-size:20px">Case Status Updated</h2>
        <p style="color:#8d95a8;margin:0 0 20px">Hi ${clientName}, your case status has been updated.</p>
        <div style="background:#161b25;border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:16px 20px;margin-bottom:20px">
          <p style="margin:0 0 8px;font-size:12px;color:#4e5668;text-transform:uppercase;letter-spacing:.06em">Case Number</p>
          <p style="margin:0 0 16px;font-weight:600">${caseNumber}</p>
          <p style="margin:0 0 8px;font-size:12px;color:#4e5668;text-transform:uppercase;letter-spacing:.06em">New Status</p>
          <p style="margin:0;font-weight:600;color:#c9a84c">${statusLabel}</p>
        </div>
        ${notes ? `<p style="color:#8d95a8;line-height:1.6;margin:0 0 20px"><strong style="color:#f0f2f7">Note:</strong> ${notes}</p>` : ''}
        <a href="${appUrl}/portal" style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#e8c76a);color:#0a0c10;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px">
          View Your Case
        </a>
        <p style="margin:24px 0 0;font-size:12px;color:#4e5668">Pinnacle Injury Consultants · Houston, TX · (832) 707-9867</p>
      </div>
    </div>
  `

  return sendEmail(to, `Case Update: ${caseNumber} — ${statusLabel}`, html)
}

export async function sendCaseStatusSMS(phone: string, clientName: string, caseNumber: string, newStatus: CaseStatus) {
  const statusLabel = STATUS_LABELS[newStatus]
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const body = `Pinnacle Injury Consultants: Hi ${clientName}, your case ${caseNumber} has been updated to "${statusLabel}". Log in to view details: ${appUrl}/portal`
  return sendSMS(phone, body)
}

export async function sendLawyerCaseEmail(
  to: string,
  lawyerName: string,
  caseNumber: string,
  clientName: string,
  caseType: string,
  description: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0a0c10;color:#f0f2f7;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#c9a84c,#e8c76a);padding:24px 32px">
        <h1 style="margin:0;color:#0a0c10;font-size:20px;font-weight:700">Pinnacle Injury Consultants</h1>
        <p style="margin:4px 0 0;color:#0a0c10;opacity:.7;font-size:13px">New Case Referral</p>
      </div>
      <div style="padding:32px">
        <h2 style="margin:0 0 12px;font-size:20px">New Case Assigned to You</h2>
        <p style="color:#8d95a8;margin:0 0 20px">Hi ${lawyerName}, a new case has been assigned to you for review.</p>
        <div style="background:#161b25;border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:16px 20px;margin-bottom:20px">
          <p style="margin:0 0 4px;font-size:12px;color:#4e5668;text-transform:uppercase;letter-spacing:.06em">Case</p>
          <p style="margin:0 0 12px;font-weight:600">${caseNumber}</p>
          <p style="margin:0 0 4px;font-size:12px;color:#4e5668;text-transform:uppercase;letter-spacing:.06em">Client</p>
          <p style="margin:0 0 12px;font-weight:600">${clientName}</p>
          <p style="margin:0 0 4px;font-size:12px;color:#4e5668;text-transform:uppercase;letter-spacing:.06em">Type</p>
          <p style="margin:0 0 12px;font-weight:600">${caseType}</p>
          <p style="margin:0 0 4px;font-size:12px;color:#4e5668;text-transform:uppercase;letter-spacing:.06em">Summary</p>
          <p style="margin:0;color:#8d95a8">${description}</p>
        </div>
        <a href="${appUrl}/dashboard/cases" style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#e8c76a);color:#0a0c10;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px">
          Review Case
        </a>
      </div>
    </div>
  `
  return sendEmail(to, `New Case Referral: ${caseNumber} — ${clientName}`, html)
}

// ─────────────────────────────────────────────────────────────────────────────
// sendNewLeadNotifications
// Orchestrates the full notification sequence when a new lead is received:
//   1. Client confirmation email
//   2. Specialist alert emails (one per active specialist)
//   3. Admin notification email
// Each step is independent — failure of one never blocks the others.
// ─────────────────────────────────────────────────────────────────────────────
export async function sendNewLeadNotifications(
  lead: {
    firstName: string
    lastName: string
    email: string
    phone: string
    caseType: string       // human-readable label, e.g. "Auto / Truck Accident"
    incidentDate: string | null
    description: string | null
    caseId: string
    caseNumber: string
  },
  specialistEmails: string[]
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const adminEmail = process.env.ADMIN_EMAIL
  const caseUrl = `${appUrl}/dashboard/cases/${lead.caseId}`
  const hasRealEmail = !!lead.email && !lead.email.includes('@noreply.')

  // ── 1. Client confirmation email ──────────────────────────────────────────
  if (hasRealEmail) {
    try {
      const clientHtml = `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0a0c10;color:#f0f2f7;border-radius:12px;overflow:hidden">
          <div style="background:linear-gradient(135deg,#c9a84c,#e8c76a);padding:24px 32px">
            <h1 style="margin:0;color:#0a0c10;font-size:20px;font-weight:700">Pinnacle Injury Consultants</h1>
            <p style="margin:4px 0 0;color:#0a0c10;opacity:.7;font-size:13px">Case Confirmation</p>
          </div>
          <div style="padding:32px">
            <h2 style="margin:0 0 12px;font-size:22px">Thank you, ${lead.firstName}. We&rsquo;ve got your case.</h2>
            <p style="color:#8d95a8;line-height:1.7;margin:0 0 24px">
              Your case has been received and a member of our team will be in touch within 24 hours.
              If you need immediate assistance, call us at
              <a href="tel:+18327079867" style="color:#c9a84c;text-decoration:none">(832) 707-9867</a>.
            </p>
            <div style="background:#161b25;border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:20px;margin-bottom:24px">
              <p style="margin:0 0 4px;font-size:11px;color:#4e5668;text-transform:uppercase;letter-spacing:.06em">Case Reference</p>
              <p style="margin:0 0 20px;font-weight:700;color:#c9a84c;font-size:20px">${lead.caseNumber}</p>
              <table style="width:100%;border-collapse:collapse">
                <tr>
                  <td style="padding:6px 0;font-size:11px;color:#4e5668;text-transform:uppercase;width:130px">Case Type</td>
                  <td style="padding:6px 0;font-size:14px">${lead.caseType}</td>
                </tr>
                ${lead.incidentDate ? `<tr>
                  <td style="padding:6px 0;font-size:11px;color:#4e5668;text-transform:uppercase">Incident Date</td>
                  <td style="padding:6px 0;font-size:14px">${lead.incidentDate}</td>
                </tr>` : ''}
              </table>
            </div>
            <a href="tel:+18327079867" style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#e8c76a);color:#0a0c10;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:14px">
              Call Us Now
            </a>
            <p style="margin:28px 0 8px;font-size:12px;color:#4e5668">
              Pinnacle Injury Consultants &middot; Houston, TX &middot; injurypinnacle.com
            </p>
            <p style="margin:0;font-size:11px;color:#4e5668;font-style:italic">
              This message is confidential. This email does not create an attorney-client relationship.
            </p>
          </div>
        </div>`
      await sendEmail(
        lead.email,
        `We received your case — Pinnacle Injury Consultants`,
        clientHtml
      )
      console.log('[notifications] Client confirmation sent to', lead.email)
    } catch (err) {
      console.error('[notifications] Client confirmation failed:', err)
    }
  }

  // ── Shared internal team email template ───────────────────────────────────
  const buildInternalHtml = (heading: string) => `
    <div style="font-family:sans-serif;max-width:580px;margin:0 auto;background:#0a0c10;color:#f0f2f7;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#c9a84c,#e8c76a);padding:24px 32px">
        <h1 style="margin:0;color:#0a0c10;font-size:20px;font-weight:700">${heading}</h1>
        <p style="margin:4px 0 0;color:#0a0c10;opacity:.7;font-size:13px">This lead requires action within 24 hours.</p>
      </div>
      <div style="padding:32px">
        <div style="background:#161b25;border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:20px;margin-bottom:24px">
          <p style="margin:0 0 4px;font-size:11px;color:#4e5668;text-transform:uppercase;letter-spacing:.06em">Case Number</p>
          <p style="margin:0 0 20px;font-weight:700;color:#c9a84c;font-size:20px">${lead.caseNumber}</p>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:6px 0;font-size:11px;color:#4e5668;text-transform:uppercase;width:120px">Name</td>
              <td style="padding:6px 0;font-size:14px;font-weight:600">${lead.firstName} ${lead.lastName}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:11px;color:#4e5668;text-transform:uppercase">Case Type</td>
              <td style="padding:6px 0;font-size:14px">${lead.caseType}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:11px;color:#4e5668;text-transform:uppercase">Phone</td>
              <td style="padding:6px 0;font-size:14px">
                <a href="tel:${lead.phone}" style="color:#c9a84c;text-decoration:none">${lead.phone}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:11px;color:#4e5668;text-transform:uppercase">Email</td>
              <td style="padding:6px 0;font-size:14px">${hasRealEmail ? lead.email : '<em style="color:#4e5668">Not provided</em>'}</td>
            </tr>
            ${lead.incidentDate ? `<tr>
              <td style="padding:6px 0;font-size:11px;color:#4e5668;text-transform:uppercase">Incident Date</td>
              <td style="padding:6px 0;font-size:14px">${lead.incidentDate}</td>
            </tr>` : ''}
          </table>
          ${lead.description ? `
          <div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,.07)">
            <p style="margin:0 0 6px;font-size:11px;color:#4e5668;text-transform:uppercase">Description</p>
            <p style="margin:0;font-size:14px;color:#8d95a8;line-height:1.6">${lead.description}</p>
          </div>` : ''}
        </div>
        <a href="${caseUrl}" style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#e8c76a);color:#0a0c10;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:14px">
          View Case in CMT &rarr;
        </a>
        <p style="margin:24px 0 0;font-size:12px;color:#4e5668">Pinnacle Injury Consultants &middot; Case Management System</p>
      </div>
    </div>`

  // ── 2. Specialist notification emails ─────────────────────────────────────
  for (const email of specialistEmails) {
    try {
      await sendEmail(
        email,
        `New case lead — ${lead.caseType} | ${lead.firstName} ${lead.lastName}`,
        buildInternalHtml('New lead assigned to your queue')
      )
      console.log('[notifications] Specialist notified:', email)
    } catch (err) {
      console.error('[notifications] Specialist notification failed for', email, ':', err)
    }
  }

  // ── 3. Admin notification email ───────────────────────────────────────────
  if (adminEmail) {
    try {
      await sendEmail(
        adminEmail,
        `New lead received — ${lead.caseType} | ${lead.firstName} ${lead.lastName}`,
        buildInternalHtml('New lead received — action required')
      )
      console.log('[notifications] Admin notified:', adminEmail)
    } catch (err) {
      console.error('[notifications] Admin notification failed:', err)
    }
  } else {
    console.warn('[notifications] ADMIN_EMAIL env var not set — admin notification skipped')
  }
}
