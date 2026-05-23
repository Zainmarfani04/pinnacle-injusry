'use client'

// EscalationTrigger — invisible client component.
// Fires GET /api/escalations/check on mount, completely in the background.
// No loading state, no error display, no user-visible side effects.
// Rendered from DashboardLayout so it runs on every authenticated dashboard load.

import { useEffect } from 'react'

export default function EscalationTrigger() {
  useEffect(() => {
    fetch('/api/escalations/check').catch(() => {
      // Intentionally silent — escalation failures are logged server-side
      // and must never surface to the user or cause UI disruption.
    })
  }, [])

  return null
}
