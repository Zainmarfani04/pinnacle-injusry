import type { Metadata } from 'next'
import { Syne, DM_Sans, Geist } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { Toaster } from '@/components/ui/sonner'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })
const syne = Syne({ subsets: ['latin'], variable: '--font-syne', display: 'swap' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' })

export const metadata: Metadata = {
  title: 'Pinnacle Case Management',
  description: 'Pinnacle Injury Consultants — Case Management Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn('h-full dark', syne.variable, dmSans.variable, geist.variable)}>
      <body className="min-h-full bg-[#0a0c10] text-[#f0f2f7] antialiased">
        {children}
        <Toaster theme="dark" position="bottom-right" />
      </body>
    </html>
  )
}
