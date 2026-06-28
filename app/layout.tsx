import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: 'OneVibe Compute Marketplace',
  description: 'Reserve frontier AI compute — Blaize QOS GSPs and RTX Pro 6000 Blackwell GPUs across 5.9 GW of contracted capacity.',
  keywords: 'compute marketplace, AI compute, Blaize GSP, RTX Blackwell, data center, GPU rental, edge AI',
  openGraph: {
    title: 'OneVibe Compute Marketplace',
    description: 'Reserve frontier AI compute at competitive rates.',
    siteName: 'OneVibe',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
